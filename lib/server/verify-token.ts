// Pure JWT verification — no Next.js imports.
// Safe to use in a custom Node.js server (server.ts) outside the app router.

import jwt from "jsonwebtoken";
import type { SteamSessionUser } from "@/lib/types/steam";

export function verifyToken(token: string): SteamSessionUser | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] }) as
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
