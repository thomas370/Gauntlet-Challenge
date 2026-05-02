import { NextResponse, type NextRequest } from "next/server";
import { verifyAssertion, extractSteamId } from "@/lib/server/openid";
import { getPlayerSummary } from "@/lib/server/steam-api";
import { signSession, sessionCookieAttrs } from "@/lib/server/auth";
import { claimCode } from "@/lib/server/pair-store";
import { env } from "@/lib/server/env";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const params = url.searchParams;
  const pair = params.get("pair");

  if (params.get("openid.mode") !== "id_res") {
    return redirectFor(pair, "cancelled");
  }

  const ok = await verifyAssertion(params);
  if (!ok) return redirectFor(pair, "invalid");

  const steamId = extractSteamId(params.get("openid.claimed_id"));
  if (!steamId) return redirectFor(pair, "invalid");

  const summary = await getPlayerSummary(steamId);
  const user = {
    steamId,
    displayName: summary?.personaname ?? "Steam User",
    avatarUrl: summary?.avatarfull ?? "",
    profileUrl: summary?.profileurl ?? `https://steamcommunity.com/profiles/${steamId}`,
  };

  // === Pairing flow: claim the code, do NOT set a session cookie. ===
  if (pair) {
    const claimed = claimCode(pair, user);
    return NextResponse.redirect(
      `${env.FRONTEND_URL}/pair?code=${encodeURIComponent(pair)}&status=${claimed ? "ok" : "expired"}`,
    );
  }

  // === Standard single-user login. ===
  const token = signSession(user);
  const res = NextResponse.redirect(`${env.FRONTEND_URL}?login=ok`);
  res.cookies.set({ ...sessionCookieAttrs(), value: token });
  return res;
}

function redirectFor(pair: string | null, status: string): NextResponse {
  if (pair) {
    return NextResponse.redirect(
      `${env.FRONTEND_URL}/pair?code=${encodeURIComponent(pair)}&status=${status}`,
    );
  }
  return NextResponse.redirect(`${env.FRONTEND_URL}?login=${status}`);
}
