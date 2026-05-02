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

  try {
    if (params.get("openid.mode") !== "id_res") {
      return redirectFor(pair, "cancelled");
    }

    const ok = await verifyAssertion(params);
    console.log("[steam/callback] verifyAssertion:", ok);
    if (!ok) return redirectFor(pair, "invalid");

    const steamId = extractSteamId(params.get("openid.claimed_id"));
    console.log("[steam/callback] steamId:", steamId);
    if (!steamId) return redirectFor(pair, "invalid");

    const summary = await getPlayerSummary(steamId);
    const user = {
      steamId,
      displayName: summary?.personaname ?? "Steam User",
      avatarUrl: summary?.avatarfull ?? "",
      profileUrl: summary?.profileurl ?? `https://steamcommunity.com/profiles/${steamId}`,
    };
    console.log("[steam/callback] user:", user.displayName);

    // === Pairing flow: claim the code, do NOT set a session cookie. ===
    if (pair) {
      const claimed = claimCode(pair, user);
      return NextResponse.redirect(
        `${env.FRONTEND_URL}/pair?code=${encodeURIComponent(pair)}&status=${claimed ? "ok" : "expired"}`,
      );
    }

    // === Standard single-user login. ===
    const token = signSession(user);
    const attrs = sessionCookieAttrs();
    const res = NextResponse.redirect(`${env.FRONTEND_URL}/lobby`);
    res.cookies.set(attrs.name, token, {
      httpOnly: attrs.httpOnly,
      secure: attrs.secure,
      sameSite: attrs.sameSite,
      path: attrs.path,
      maxAge: attrs.maxAge,
    });
    console.log("[steam/callback] cookie set, redirecting to /lobby");
    return res;
  } catch (err) {
    console.error("[steam/callback] error:", err);
    return redirectFor(pair, "invalid");
  }
}

function redirectFor(pair: string | null, status: string): NextResponse {
  if (pair) {
    return NextResponse.redirect(
      `${env.FRONTEND_URL}/pair?code=${encodeURIComponent(pair)}&status=${status}`,
    );
  }
  return NextResponse.redirect(`${env.FRONTEND_URL}?login=${status}`);
}
