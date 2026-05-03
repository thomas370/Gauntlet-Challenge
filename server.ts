/**
 * Custom Next.js server with Socket.io WebSocket support.
 * Start: tsx --tsconfig tsconfig.server.json server.ts
 */

process.on("uncaughtException", (err) => {
  console.error("[server] uncaughtException:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("[server] unhandledRejection:", reason);
  process.exit(1);
});

console.log("[server] starting…");

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

console.log(`[server] mode=${dev ? "dev" : "prod"} port=${port}`);

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

console.log("[server] calling app.prepare()…");

app.prepare()
  .then(() => {
    console.log("[server] Next.js ready, starting HTTP server…");

    const httpServer = createServer((req, res) => {
      const parsedUrl = parse(req.url ?? "/", true);
      handle(req, res, parsedUrl);
    });

    const corsOrigin = dev
      ? "*"
      : (process.env.FRONTEND_URL ?? process.env.STEAM_REALM ?? "*");

    const io = new SocketIOServer(httpServer, {
      // ── TIMING FIX ─────────────────────────────────────────────────────────
      // pingTimeout DOIT être > pingInterval, sinon le serveur déclare le client
      // mort avant que le pong puisse arriver → déconnexions en boucle.
      // pingInterval = durée max d'un GET long-poll avant d'envoyer un ping.
      // pingTimeout  = délai max pour recevoir le pong après avoir envoyé le ping.
      pingInterval: 10_000,  // GET poll toutes les 10s (plus réactif)
      pingTimeout:  30_000,  // attendre 30s le pong (bien > pingInterval)
      upgradeTimeout: 15_000,
      // Polling d'abord (connexion instantanée) puis upgrade WebSocket si dispo.
      // C'est l'ordre par défaut Socket.io — plus fiable derrière un proxy.
      transports: ["polling", "websocket"],
      cors: {
        origin: corsOrigin,
        credentials: true,
      },
    });

    // ── PROXY BUFFERING FIX ─────────────────────────────────────────────────
    // AlwaysData utilise nginx qui bufferise les réponses proxy par défaut.
    // Sans ce header, les données Socket.io (polling) arrivent en retard ou jamais.
    // X-Accel-Buffering: no → nginx envoie les octets dès qu'ils arrivent.
    io.engine.on("headers", (headers: Record<string, string>) => {
      headers["X-Accel-Buffering"] = "no";
      headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    });

    // ── auth middleware ──────────────────────────────────────────────────────
    io.use((socket, next) => {
      const cookies = parseCookies(socket.handshake.headers.cookie ?? "");
      const token = cookies[SESSION_COOKIE];
      if (!token) return next(new Error("Not authenticated"));
      const user = verifyToken(token);
      if (!user) return next(new Error("Invalid session"));
      (socket as Socket & { data: { user: SteamSessionUser } }).data.user = user;
      next();
    });

    // ── connection handler ───────────────────────────────────────────────────
    io.on("connection", (socket) => {
      const user: SteamSessionUser = socket.data.user;
      let currentCode: string | null = null;
      let unsub: (() => void) | null = null;

      const cleanup = () => {
        if (!currentCode) return;
        unsub?.();
        leaveRoom(currentCode, user.steamId);
        currentCode = null;
        unsub = null;
      };

      // ── join ───────────────────────────────────────────────────────────────
      socket.on("join", ({ code }: { code: string }) => {
        cleanup(); // quitte la room précédente si l'utilisateur switche

        const joined = joinRoom(code, user);
        if ("error" in joined) {
          socket.emit("room_error", { message: joined.error, code: "NOT_FOUND" });
          return;
        }

        currentCode = code;

        const result = subscribe(code, user.steamId, (event) => {
          socket.emit(event.type, event);
        });

        if ("error" in result) {
          socket.emit("room_error", { message: result.error, code: "NOT_FOUND" });
          // joinRoom a réussi mais subscribe a échoué → nettoyer le membre
          leaveRoom(code, user.steamId);
          currentCode = null;
          return;
        }

        unsub = result.unsubscribe;

        // Snapshot initial — le client l'utilise pour peupler son état
        socket.emit("state",   { type: "state",   state:   result.snapshot.state });
        socket.emit("members", { type: "members", members: result.snapshot.members });
      });

      // ── mutate ─────────────────────────────────────────────────────────────
      socket.on("mutate", ({ state }: { state: GauntletState }) => {
        if (!currentCode) return;
        const result = mutateState(currentCode, user.steamId, state);
        if ("error" in result) {
          // Si la room n'existe plus, signaler au client pour qu'il redirige
          console.warn(`[server] mutate failed for ${user.steamId}: ${result.error}`);
          socket.emit("room_error", { message: result.error, code: "NOT_FOUND" });
        }
      });

      // ── leave / disconnect ─────────────────────────────────────────────────
      socket.on("leave", cleanup);
      socket.on("disconnect", cleanup);
    });

    // ── listen ────────────────────────────────────────────────────────────────
    httpServer.listen(port, () => {
      console.log(`> Ready on http://localhost:${port} [${dev ? "dev" : "prod"}]`);
    });
  })
  .catch((err) => {
    console.error("[server] app.prepare() failed:", err);
    process.exit(1);
  });
