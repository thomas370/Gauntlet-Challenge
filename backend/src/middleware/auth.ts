// Express auth middleware. Reads the session cookie, attaches `req.user` if
// valid, otherwise responds 401 (when `requireAuth` is mounted on the route).

import type { NextFunction, Request, Response } from "express";
import { getSessionFromRequest } from "../lib/auth";
import type { SteamSessionUser } from "@shared/types/steam";

declare module "express-serve-static-core" {
  interface Request {
    user?: SteamSessionUser;
  }
}

/** Attach req.user if a valid session cookie is present. Never blocks. */
export function attachUser(req: Request, _res: Response, next: NextFunction): void {
  const user = getSessionFromRequest(req);
  if (user) req.user = user;
  next();
}

/** Block the request unless req.user is set. Run after attachUser. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}
