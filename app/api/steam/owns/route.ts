import { NextResponse, type NextRequest } from "next/server";
import { HttpError, requireSteamAuth } from "@/lib/server/auth";
import { resolveOwnership } from "@/lib/server/ownership";
import { rateLimit } from "@/lib/server/rate-limit";
import type { OwnershipResult } from "@/lib/types/steam";

const MAX_BATCH = 100;

export async function POST(req: NextRequest) {
  try {
    const user = requireSteamAuth(req);

    const body = (await req.json().catch(() => null)) as { appIds?: unknown } | null;
    const ids = Array.isArray(body?.appIds) ? body!.appIds : null;
    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: "Body must include appIds: number[]" }, { status: 400 });
    }
    if (ids.length > MAX_BATCH) {
      return NextResponse.json({ error: `Max ${MAX_BATCH} appIds per batch` }, { status: 400 });
    }
    const appIds: number[] = [];
    for (const v of ids) {
      const n = Number(v);
      if (!Number.isFinite(n) || n <= 0) {
        return NextResponse.json({ error: `Invalid appId: ${v}` }, { status: 400 });
      }
      appIds.push(n);
    }

    const limit = rateLimit(user.steamId);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Rate limited", retryAfterMs: limit.retryAfterMs },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } },
      );
    }

    const refresh = req.nextUrl.searchParams.get("refresh") === "true";
    const map = await resolveOwnership({ steamId: user.steamId, appIds, refresh });

    // Spec-shape `results` (boolean | "unknown") plus a `details` map for callers that want more.
    const results: Record<string, boolean | "unknown"> = {};
    const details: Record<string, OwnershipResult> = {};
    for (const id of appIds) {
      const r = map.get(id);
      if (!r) {
        results[id] = "unknown";
        continue;
      }
      results[id] = r.owned === "likely" ? true : r.owned;
      details[id] = r;
    }

    return NextResponse.json({ steamId: user.steamId, results, details });
  } catch (e) {
    if (e instanceof HttpError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("[POST /api/steam/owns]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
