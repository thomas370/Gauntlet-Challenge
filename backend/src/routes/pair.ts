// /api/pair/* — host-issued 6-char codes that a player claims after Steam OAuth.

import { Router } from "express";
import { createCode, peekCode, consumeCode } from "../lib/pair-store";

const router = Router();

router.post("/code", (_req, res) => {
  const { code, expiresInSec } = createCode();
  res.json({ code, expiresInSec });
});

router.get("/:code/status", (req, res) => {
  const status = peekCode(req.params.code.toUpperCase());
  if (!status.exists) {
    res.status(404).json({ exists: false });
    return;
  }
  res.json(status);
});

router.post("/:code/consume", (req, res) => {
  const user = consumeCode(req.params.code.toUpperCase());
  if (!user) {
    res.status(404).json({ user: null });
    return;
  }
  res.json({ user });
});

export default router;
