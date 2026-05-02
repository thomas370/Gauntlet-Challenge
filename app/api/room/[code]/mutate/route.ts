// POST /api/room/[code]/mutate — replace the room's gauntlet state with the body.
// Server is authoritative: the new state is broadcast to all subscribers via SSE.

import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/server/auth";
import { mutateState } from "@/lib/server/room-store";
import type { GauntletState } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } },
) {
  const user = getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { state?: GauntletState } | null;
  if (!body || !body.state) {
    return NextResponse.json({ error: "Missing state" }, { status: 400 });
  }
  const result = mutateState(params.code, user.steamId, body.state);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ ok: true });
}
