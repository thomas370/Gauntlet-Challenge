import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/server/auth";
import { leaveRoom } from "@/lib/server/room-store";

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } },
) {
  const user = getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const ok = leaveRoom(params.code, user.steamId);
  return NextResponse.json({ ok });
}
