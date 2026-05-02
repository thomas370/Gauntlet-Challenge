// POST /api/room — create a new room. Owner = current authenticated user.

import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/server/auth";
import { createRoom } from "@/lib/server/room-store";

export async function POST(req: NextRequest) {
  const user = getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const room = createRoom(user);
  return NextResponse.json(room);
}
