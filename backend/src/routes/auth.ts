// /api/auth/* — Steam OpenID flow + logout + session probe.

import { Router } from "express";
import { buildLoginUrl, verifyAssertion, extractSteamId } from "../lib/openid";
import { getPlayerSummary } from "../lib/steam-api";
import { signSession, sessionCookieAttrs, SESSION_COOKIE, verifySession } from "../lib/auth";
import { claimCode } from "../lib/pair-store";

const router = Router();

// GET /api/auth/steam — kick off Steam OpenID by 302-ing to Steam.
router.get("/steam", (req, res) => {
  const pair = typeof req.query.pair === "string" ? req.query.pair : undefined;
  res.redirect(buildLoginUrl(pair));
});

// GET /api/auth/steam/callback — Steam redirects here with openid.* params.
router.get("/steam/callback", async (req, res) => {
  const pair = typeof req.query.pair === "string" ? req.query.pair : null;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value)) params.set(key, String(value[0]));
  }

  try {
    if (params.get("openid.mode") !== "id_res") return redirectFor(res, pair, "cancelled");

    const ok = await verifyAssertion(params);
    console.log("[steam/callback] verifyAssertion:", ok);
    if (!ok) return redirectFor(res, pair, "invalid");

    const steamId = extractSteamId(params.get("openid.claimed_id"));
    console.log("[steam/callback] steamId:", steamId);
    if (!steamId) return redirectFor(res, pair, "invalid");

    const summary = await getPlayerSummary(steamId);
    const user = {
      steamId,
      displayName: summary?.personaname ?? "Steam User",
      avatarUrl: summary?.avatarfull ?? "",
      profileUrl: summary?.profileurl ?? `https://steamcommunity.com/profiles/${steamId}`,
    };
    console.log("[steam/callback] user:", user.displayName);

    if (pair) {
      const claimed = claimCode(pair, user);
      res.redirect(`/pair?code=${encodeURIComponent(pair)}&status=${claimed ? "ok" : "expired"}`);
      return;
    }

    const token = signSession(user);
    const attrs = sessionCookieAttrs();
    res.cookie(attrs.name, token, {
      httpOnly: attrs.httpOnly,
      secure: attrs.secure,
      sameSite: attrs.sameSite,
      path: attrs.path,
      maxAge: attrs.maxAge * 1000,
    });
    console.log("[steam/callback] cookie set, redirecting to /lobby");
    res.redirect("/lobby");
  } catch (err) {
    console.error("[steam/callback] error:", err);
    redirectFor(res, pair, "invalid");
  }
});

// POST /api/auth/logout
router.post("/logout", (_req, res) => {
  const attrs = sessionCookieAttrs();
  res.cookie(attrs.name, "", {
    httpOnly: attrs.httpOnly,
    secure: attrs.secure,
    sameSite: attrs.sameSite,
    path: attrs.path,
    maxAge: 0,
  });
  res.json({ ok: true });
});

// GET /api/auth/me — vérifie la session, clear le cookie si invalide.
router.get("/me", (req, res) => {
  const token = (req.cookies as Record<string, string> | undefined)?.[SESSION_COOKIE];
  const user = token ? verifySession(token) : null;
  if (!user) {
    if (token) {
      const attrs = sessionCookieAttrs();
      res.cookie(attrs.name, "", {
        httpOnly: attrs.httpOnly,
        secure: attrs.secure,
        sameSite: attrs.sameSite,
        path: attrs.path,
        maxAge: 0,
      });
    }
    res.json({ user: null });
    return;
  }
  res.json({ user });
});

function redirectFor(res: import("express").Response, pair: string | null, status: string): void {
  if (pair) {
    res.redirect(`/pair?code=${encodeURIComponent(pair)}&status=${status}`);
    return;
  }
  res.redirect(`/?login=${status}`);
}

export default router;
