// /api/room/* — Room lifecycle. Realtime mutations go through Socket.io.

import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createRoom, getRoom, joinRoom, leaveRoom } from "../lib/room-store";

const router = Router();

// POST /api/room — create a new room. Owner = current authenticated user.
router.post("/", requireAuth, (req, res) => {
  const room = createRoom(req.user!);
  res.json(room);
});

// GET /api/room/:code — fetch a room snapshot.
router.get("/:code", requireAuth, (req, res) => {
  const room = getRoom(req.params.code);
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json(room);
});

// POST /api/room/:code/join
router.post("/:code/join", requireAuth, (req, res) => {
  const result = joinRoom(req.params.code, req.user!);
  if ("error" in result) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});

// POST /api/room/:code/leave
router.post("/:code/leave", requireAuth, (req, res) => {
  const ok = leaveRoom(req.params.code, req.user!.steamId);
  res.json({ ok });
});

export default router;
