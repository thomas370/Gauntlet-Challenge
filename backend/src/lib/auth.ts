// JWT session token issued in an HttpOnly cookie.

import jwt from "jsonwebtoken";
import type { Request } from "express";
import { env } from "./env";
import { verifyToken } from "./verify-token";
import type { SteamSessionUser } from "@shared/types/steam";

import { SESSION_COOKIE } from "@shared/session-cookie";
export { SESSION_COOKIE };
const SESSION_TTL_DAYS = 7;

export function signSession(user: SteamSessionUser): string {
  return jwt.sign(user, env.JWT_SECRET, { expiresIn: `${SESSION_TTL_DAYS}d`, algorithm: "HS256" });
}

export const verifySession = verifyToken;

export interface SessionCookieAttrs {
  name: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
  maxAge: number; // seconds
}

export function sessionCookieAttrs(): SessionCookieAttrs {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  };
}

/** Read the current session from an Express request. Returns null if missing/invalid. */
export function getSessionFromRequest(req: Request): SteamSessionUser | null {
  const token = (req.cookies as Record<string, string> | undefined)?.[SESSION_COOKIE];
  return token ? verifySession(token) : null;
}

/** Throw a 401-shaped HttpError if the request isn't authenticated. */
export function requireSteamAuth(req: Request): SteamSessionUser {
  const user = getSessionFromRequest(req);
  if (!user) {
    throw new HttpError(401, "Not authenticated");
  }
  return user;
}

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}
