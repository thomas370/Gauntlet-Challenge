// @ts-check
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

/**
 * @typedef {{ id: string, name: string }} Player
 * @typedef {{ hostSocketId: string, players: Player[], state: object, started: boolean }} Room
 */

/** @type {Map<string, Room>} */
const rooms = new Map();

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  do {
    code = Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  } while (rooms.has(code));
  return code;
}

/** @param {Player[]} players */
function buildPlayersState(players) {
  const names = players.map((p) => p.name);
  return {
    players: [names[0] ?? "", names[1] ?? "", names[2] ?? ""],
    playerCount: Math.min(Math.max(players.length, 1), 3),
  };
}

/** @param {import('socket.io').Socket} socket @param {import('socket.io').Server} io */
function handleLeave(socket, io) {
  const code = socket.data?.roomCode;
  if (!code) return;
  const room = rooms.get(code);
  if (!room) return;

  socket.data.roomCode = null;
  room.players = room.players.filter((p) => p.id !== socket.id);

  if (room.players.length === 0) {
    rooms.delete(code);
    return;
  }

  // Transfer host if needed
  if (room.hostSocketId === socket.id) {
    room.hostSocketId = room.players[0].id;
    io.to(room.hostSocketId).emit("host_assigned");
  }

  room.state = { ...room.state, ...buildPlayersState(room.players) };
  io.to(code).emit("room_update", {
    players: room.players.map((p) => p.name),
    state: room.state,
  });
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  });

  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    // ── Créer une room ──────────────────────────────────────────────────
    socket.on("create_room", ({ name }) => {
      if (!name?.trim()) return;
      const code = generateCode();
      const playersList = [{ id: socket.id, name: name.trim() }];
      const state = {
        attempt: 1, current: 0, difficulty: "normal", penaltyMode: "reset",
        ...buildPlayersState(playersList),
        pinned: [], run: [], champions: {}, done: [],
        filter: "all", search: "", soundEnabled: true,
        showHistory: false, runStartTime: null, runFails: {}, history: [],
      };
      rooms.set(code, { hostSocketId: socket.id, players: playersList, state, started: false });
      socket.join(code);
      socket.data.roomCode = code;
      socket.emit("room_created", { code, state });
    });

    // ── Rejoindre une room ───────────────────────────────────────────────
    socket.on("join_room", ({ code, name }) => {
      const upperCode = code?.trim().toUpperCase();
      const room = rooms.get(upperCode);
      if (!room) { socket.emit("room_error", { message: `Room « ${upperCode} » introuvable.` }); return; }
      if (!name?.trim()) { socket.emit("room_error", { message: "Pseudo requis." }); return; }
      if (room.players.length >= 3) { socket.emit("room_error", { message: "Room pleine (max 3 joueurs)." }); return; }
      if (room.started) { socket.emit("room_error", { message: "La partie a déjà commencé." }); return; }

      room.players.push({ id: socket.id, name: name.trim() });
      room.state = { ...room.state, ...buildPlayersState(room.players) };

      socket.join(upperCode);
      socket.data.roomCode = upperCode;

      // Send full state to joiner
      socket.emit("room_joined", { code: upperCode, state: room.state });
      // Notify others that a new player joined
      socket.to(upperCode).emit("room_update", {
        players: room.players.map((p) => p.name),
        state: room.state,
      });
    });

    // ── Lancer la partie (hôte) ──────────────────────────────────────────
    socket.on("start_game", ({ code }) => {
      const room = rooms.get(code);
      if (!room || room.hostSocketId !== socket.id) return;
      room.started = true;
      io.to(code).emit("game_started", { code, state: room.state });
    });

    // ── Synchronisation d'état (hôte → tous) ─────────────────────────────
    socket.on("state_sync", ({ code, state }) => {
      const room = rooms.get(code);
      if (!room || room.hostSocketId !== socket.id) return;
      room.state = state;
      socket.to(code).emit("game_state_update", { state });
    });

    // ── Quitter / déconnexion ────────────────────────────────────────────
    socket.on("leave_room", () => handleLeave(socket, io));
    socket.on("disconnect", () => handleLeave(socket, io));
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
