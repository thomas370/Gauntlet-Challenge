// GET /api/me/overlay-token
//
// Returns a stable, long-lived token bound to the caller's Steam ID. The
// streamer pastes it into OBS browser-source URLs once and the same URLs keep
// working across runs/rooms.

import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/server/auth";
import { signOverlayToken } from "@/lib/server/overlay-token";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = getSessionFromCookies();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  return NextResponse.json({ token: signOverlayToken(user.steamId) });
}
