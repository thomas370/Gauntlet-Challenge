// /api/pair/* — host-issued 6-char codes that a player claims after Steam OAuth.

import { Router } from "express";
import { createCode, peekCode, consumeCode } from "../lib/pair-store";

const router = Router();

// POST /api/pair/code → { code, expiresInSec }
router.post("/code", (_req, res) => {
  const { code, expiresInSec } = createCode();
  res.json({ code, expiresInSec });
});

// GET /api/pair/:code/status
router.get("/:code/status", (req, res) => {
  const status = peekCode(req.params.code.toUpperCase());
  if (!status.exists) {
    res.status(404).json({ exists: false });
    return;
  }
  res.json(status);
});

// POST /api/pair/:code/consume — host applies the claimed user to a slot.
router.post("/:code/consume", (req, res) => {
  const user = consumeCode(req.params.code.toUpperCase());
  if (!user) {
    res.status(404).json({ user: null });
    return;
  }
  res.json({ user });
});

export default router;
