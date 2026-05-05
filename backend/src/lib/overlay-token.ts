// Long-lived per-user overlay token.
//
// Used so streamers can keep the same OBS browser-source URLs across rooms —
// the token resolves to a steamId, and the SSE endpoint streams whatever room
// that user is currently in.
//
// Signed with the same JWT secret as the session cookie, but no expiry: the
// token is meant to live in OBS configuration for as long as the user wants.
// Compromise of the token only exposes read-only overlay state, which is the
// same risk surface as the room-code form.

import jwt from "jsonwebtoken";

interface OverlayTokenPayload {
  kind: "overlay";
  steamId: string;
}

export function signOverlayToken(steamId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not configured");
  const payload: OverlayTokenPayload = { kind: "overlay", steamId };
  return jwt.sign(payload, secret, { algorithm: "HS256" });
}

export function verifyOverlayToken(token: string): { steamId: string } | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
    if (typeof payload === "string") return null;
    if ((payload as OverlayTokenPayload).kind !== "overlay") return null;
    const steamId = (payload as OverlayTokenPayload).steamId;
    if (typeof steamId !== "string" || steamId.length === 0) return null;
    return { steamId };
  } catch {
    return null;
  }
}
