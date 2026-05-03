/**
 * Custom Next.js server with Socket.io WebSocket support.
 *
 * Run with:
 *   dev  → tsx --tsconfig tsconfig.server.json server.ts
 *   prod → node -r tsx/cjs server.ts   (or compile first)
 *
 * Socket.io handles all real-time room events (join / mutate / leave).
 * Next.js handles everything else (pages, API routes, static assets).
 */

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer, type Socket } from "socket.io";
import { joinRoom, leaveRoom, subscribe, mutateState } from "./lib/server/room-store";
import { verifyToken } from "./lib/server/verify-token";
import { SESSION_COOKIE } from "./lib/session-cookie";
import type { GauntletState } from "./lib/types";
import type { SteamSessionUser } from "./lib/types/steam";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "3000", 10);

// ── cookie helpers ──────────────────────────────────────────────────────────
function parseCookies(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    try {
      out[k] = decodeURIComponent(v);
    } catch {
      out[k] = v;
    }
  }
  return out;
}

// ── boot ────────────────────────────────────────────────────────────────────
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "/", true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    // Default path (/socket.io/) — Next.js won't intercept it.
    cors: {
      origin: process.env.FRONTEND_URL ?? `http://localhost:${port}`,
      credentials: true,
    },
  });

  // ── auth middleware ────────────────────────────────────────────────────────
  io.use((socket, next) => {
    const cookies = parseCookies(socket.handshake.headers.cookie ?? "");
    const token = cookies[SESSION_COOKIE];
    if (!token) return next(new Error("Not authenticated"));
    const user = verifyToken(token);
    if (!user) return next(new Error("Invalid session"));
    (socket as Socket & { data: { user: SteamSessionUser } }).data.user = user;
    next();
  });

  // ── connection handler ─────────────────────────────────────────────────────
  io.on("connection", (socket) => {
    const user: SteamSessionUser = socket.data.user;
    let currentCode: string | null = null;
    let unsub: (() => void) | null = null;

    // Clean up current room subscription
    const cleanup = () => {
      if (!currentCode) return;
      unsub?.();
      leaveRoom(currentCode, user.steamId);
      currentCode = null;
      unsub = null;
    };

    // ── join ────────────────────────────────────────────────────────────────
    socket.on("join", ({ code }: { code: string }) => {
      cleanup(); // leave previous room if switching

      const joined = joinRoom(code, user);
      if ("error" in joined) {
        socket.emit("room_error", { message: joined.error });
        return;
      }

      currentCode = code;

      // Subscribe: server pushes any broadcast back through this socket
      const result = subscribe(code, user.steamId, (event) => {
        socket.emit(event.type, event);
      });

      if ("error" in result) {
        socket.emit("room_error", { message: result.error });
        currentCode = null;
        return;
      }

      unsub = result.unsubscribe;

      // Send initial snapshot to the joining client
      socket.emit("state", { type: "state", state: result.snapshot.state });
      socket.emit("members", { type: "members", members: result.snapshot.members });
    });

    // ── mutate ──────────────────────────────────────────────────────────────
    socket.on("mutate", ({ state }: { state: GauntletState }) => {
      if (!currentCode) return;
      mutateState(currentCode, user.steamId, state);
      // mutateState broadcasts to all subscribers (including this socket),
      // so the sender will also receive a "state" event back — same as before.
    });

    // ── leave / disconnect ──────────────────────────────────────────────────
    socket.on("leave", cleanup);
    socket.on("disconnect", cleanup);
  });

  // ── start ──────────────────────────────────────────────────────────────────
  httpServer.listen(port, () => {
    const mode = dev ? "dev" : "prod";
    console.log(`> Ready on http://localhost:${port} [${mode}]`);
  });
});
