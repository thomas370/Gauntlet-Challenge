// /api/me/* — current user + overlay token.

import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { signOverlayToken } from "../lib/overlay-token";

const router = Router();

// GET /api/me — returns the current user, or null. Public (returns null if no
// session). Mirrors the legacy Next.js shape (no { user: ... } wrapper).
router.get("/", (req, res) => {
  if (!req.user) {
    res.json(null);
    return;
  }
  res.json(req.user);
});

// GET /api/me/overlay-token — long-lived token for OBS browser sources.
router.get("/overlay-token", requireAuth, (req, res) => {
  res.json({ token: signOverlayToken(req.user!.steamId) });
});

export default router;
