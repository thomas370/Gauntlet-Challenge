/**
 * Custom Next.js server with Socket.io WebSocket support.
 * Start: tsx --tsconfig tsconfig.server.json server.ts
 */

// Catch any unhandled error so it always prints instead of silently exiting.
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

    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL ?? `http://localhost:${port}`,
        credentials: true,
      },
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

      socket.on("join", ({ code }: { code: string }) => {
        cleanup();
        const joined = joinRoom(code, user);
        if ("error" in joined) {
          socket.emit("room_error", { message: joined.error });
          return;
        }
        currentCode = code;
        const result = subscribe(code, user.steamId, (event) => {
          socket.emit(event.type, event);
        });
        if ("error" in result) {
          socket.emit("room_error", { message: result.error });
          currentCode = null;
          return;
        }
        unsub = result.unsubscribe;
        socket.emit("state", { type: "state", state: result.snapshot.state });
        socket.emit("members", { type: "members", members: result.snapshot.members });
      });

      socket.on("mutate", ({ state }: { state: GauntletState }) => {
        if (!currentCode) return;
        mutateState(currentCode, user.steamId, state);
      });

      socket.on("leave", cleanup);
      socket.on("disconnect", cleanup);
    });

    // ── listen ───────────────────────────────────────────────────────────────
    httpServer.listen(port, () => {
      console.log(`> Ready on http://localhost:${port} [${dev ? "dev" : "prod"}]`);
    });
  })
  .catch((err) => {
    console.error("[server] app.prepare() failed:", err);
    process.exit(1);
  });
