// /api/stats/* — public read-only stats. No auth: Steam profiles are public
// info and these endpoints only surface aggregate gameplay outcomes.

import { Router } from "express";
import { getGameStats, getLeaderboards, getProfile } from "../lib/db";

const router = Router();

const STEAM_ID_RE = /^\d{17}$/;

router.get("/profile", (req, res) => {
  const steamId = String(req.query.steamId ?? "");
  if (!STEAM_ID_RE.test(steamId)) {
    res.status(400).json({ error: "invalid steamId" });
    return;
  }
  const profile = getProfile(steamId);
  if (!profile) {
    res.status(404).json({ error: "no runs recorded" });
    return;
  }
  res.json(profile);
});

router.get("/leaderboards", (_req, res) => {
  res.json(getLeaderboards());
});

router.get("/games", (_req, res) => {
  res.json(getGameStats());
});

export default router;
