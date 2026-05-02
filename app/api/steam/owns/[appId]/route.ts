import { NextResponse, type NextRequest } from "next/server";
import { HttpError, requireSteamAuth } from "@/lib/server/auth";
import { resolveOwnership } from "@/lib/server/ownership";
import { rateLimit } from "@/lib/server/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: { appId: string } },
) {
  try {
    const user = requireSteamAuth(req);

    const appId = Number(params.appId);
    if (!Number.isFinite(appId) || appId <= 0) {
      return NextResponse.json({ error: "Invalid appId" }, { status: 400 });
    }

    const limit = rateLimit(user.steamId);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Rate limited", retryAfterMs: limit.retryAfterMs },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } },
      );
    }

    const refresh = req.nextUrl.searchParams.get("refresh") === "true";
    const map = await resolveOwnership({ steamId: user.steamId, appIds: [appId], refresh });
    const result = map.get(appId);
    if (!result) {
      return NextResponse.json({ error: "Resolution failed" }, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}

function errorResponse(e: unknown): NextResponse {
  if (e instanceof HttpError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  console.error("[/api/steam/owns/:appId]", e);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}
