// Entry point. Loads .env, builds the Express app, attaches Socket.io,
// listens on PORT.

import "dotenv/config";
import { createServer } from "http";
import { createApp } from "./app";
import { attachSocketIO } from "./socket";
import { closeDb, getDb } from "./lib/db";

process.on("uncaughtException", (err) => {
  console.error("[server] uncaughtException:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("[server] unhandledRejection:", reason);
  process.exit(1);
});

const port = parseInt(process.env.PORT ?? "3000", 10);
const dev = process.env.NODE_ENV !== "production";

console.log(`[server] starting (mode=${dev ? "dev" : "prod"} port=${port})`);

// Open SQLite + apply migrations before the server accepts traffic. Failing
// fast here is the right call: a broken DB means no run history can be saved,
// and we'd rather know on boot than silently lose runs.
getDb();

const app = createApp();
const httpServer = createServer(app);
const io = attachSocketIO(httpServer);

httpServer.listen(port, () => {
  console.log(`> Ready on http://localhost:${port} [${dev ? "dev" : "prod"}]`);
});

// Graceful shutdown — AlwaysData (et la plupart des hosts gérés) envoient SIGTERM
// quand ils stoppent/reboot. Sans handler, Node coupe abruptement (TCP reset
// pour les requêtes en cours, déconnexion sale pour Socket.io).
let shuttingDown = false;
const shutdown = (signal: string): void => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[server] received ${signal}, draining…`);
  httpServer.close((err) => {
    if (err) console.error("[server] httpServer.close error:", err);
    else console.log("[server] HTTP server closed");
  });
  io.close(() => {
    console.log("[server] socket.io closed");
    closeDb();
    console.log("[server] db closed, exiting");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("[server] graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, 10_000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
