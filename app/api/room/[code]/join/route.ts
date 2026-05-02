import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/server/auth";
import { joinRoom } from "@/lib/server/room-store";

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } },
) {
  const user = getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const result = joinRoom(params.code, user);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
