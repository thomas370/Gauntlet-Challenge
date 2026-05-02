// JWT session token issued in an HttpOnly cookie.

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { env } from "./env";
import type { SteamSessionUser } from "@/lib/types/steam";

import { SESSION_COOKIE } from "@/lib/session-cookie";
export { SESSION_COOKIE };
const SESSION_TTL_DAYS = 7;

export function signSession(user: SteamSessionUser): string {
  return jwt.sign(user, env.JWT_SECRET, { expiresIn: `${SESSION_TTL_DAYS}d`, algorithm: "HS256" });
}

export function verifySession(token: string): SteamSessionUser | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }) as
      | (SteamSessionUser & { iat: number; exp: number })
      | string;
    if (typeof payload === "string") return null;
    const { steamId, displayName, avatarUrl, profileUrl } = payload;
    if (!steamId) return null;
    return { steamId, displayName, avatarUrl, profileUrl };
  } catch {
    return null;
  }
}

export function sessionCookieAttrs() {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  };
}

/** Read the current session from cookies. Returns null if missing/invalid. */
export function getSessionFromCookies(): SteamSessionUser | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return token ? verifySession(token) : null;
}

/** Same as above but reads from a NextRequest (route handlers can use either). */
export function getSessionFromRequest(req: NextRequest): SteamSessionUser | null {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return token ? verifySession(token) : null;
}

/** Throw a 401-shaped Response if the request isn't authenticated. */
export function requireSteamAuth(req: NextRequest): SteamSessionUser {
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
