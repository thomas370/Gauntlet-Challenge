// GET /api/room/[code] — fetch a room snapshot. Used by lobby/join flows to validate.

import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/server/auth";
import { getRoom } from "@/lib/server/room-store";

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } },
) {
  const user = getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const room = getRoom(params.code);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  return NextResponse.json(room);
}
