// Express app composition. Mounts API routes and serves the static frontend
// build (frontend/out/) on the same origin — option 1 du plan.

import path from "path";
import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import { env } from "./lib/env";
import { attachUser } from "./middleware/auth";

import authRoutes from "./routes/auth";
import meRoutes from "./routes/me";
import pairRoutes from "./routes/pair";
import roomRoutes from "./routes/room";
import steamRoutes from "./routes/steam";
import overlayRoutes from "./routes/overlay";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // Inject req.user from the session cookie when present (best-effort).
  app.use(attachUser);

  // === API ===
  app.use("/api/auth", authRoutes);
  app.use("/api/me", meRoutes);
  app.use("/api/pair", pairRoutes);
  app.use("/api/room", roomRoutes);
  app.use("/api/steam", steamRoutes);
  app.use("/api/overlay", overlayRoutes);

  // === Static frontend ===
  // `next build` (output: 'export') → frontend/out/ contient l'app statique.
  // FRONTEND_DIST est résolu depuis backend/ par défaut → ../frontend/out
  const frontendDist = path.resolve(process.cwd(), env.FRONTEND_DIST);

  app.use(
    express.static(frontendDist, {
      index: "index.html",
      // Long-cache pour les assets immutables (Next met un hash dans le nom).
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}_next${path.sep}static${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }),
  );

  // SPA fallback — on retombe sur l'index.html si la route n'existe pas.
  // Les routes /api/* qui ne matchent rien retournent 404 normal.
  app.use((req, res, next) => {
    if (req.method !== "GET") return next();
    if (req.path.startsWith("/api/")) return next();
    if (req.path.startsWith("/socket.io/")) return next();
    res.sendFile(path.join(frontendDist, "index.html"), (err) => {
      if (err) next();
    });
  });

  // === Error handler ===
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[express] error:", err);
    if (res.headersSent) return;
    res.status(500).json({ error: "Internal error" });
  });

  return app;
}
