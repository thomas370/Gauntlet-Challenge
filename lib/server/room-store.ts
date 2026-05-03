// In-memory multiplayer-room store with an SSE pub/sub fanout.
//
// One process = one shared store. For multi-instance hosting, swap to Redis pub/sub
// (the public surface of this module is small enough to make that drop-in later).
//
// Each room has:
//   - a Map of members keyed by steamId
//   - a synced GauntletState
//   - a Set of subscriber objects, each with an enqueue function (the SSE writer)
//
// On every state or membership mutation we re-broadcast to all subscribers. Each
// subscriber is also detached automatically when its underlying response is closed.

import { DEFAULT_STATE, type GauntletState } from "@/lib/types";
import type { SteamSessionUser } from "@/lib/types/steam";
import type { RoomEvent, RoomMember, RoomSnapshot } from "@/lib/types/room";

const MAX_MEMBERS = 8;
const ROOM_TTL_MS = 12 * 60 * 60 * 1000; // 12h since last activity (active rooms)
// How long an empty room stays around waiting for someone to come back via the
// URL — covers a computer reboot, browser close, or any longer absence than the
// per-socket grace window. Returning to /room/<code> inside this window auto-
// rejoins (joinRoom is idempotent and re-adds missing members).
const EMPTY_ROOM_TTL_MS = 60 * 60 * 1000; // 1h
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // unambiguous characters

interface Subscriber {
  steamId: string;
  send: (event: RoomEvent) => void;
}

interface Room {
  code: string;
  ownerSteamId: string;
  members: Map<string, RoomMember>;
  state: GauntletState;
  createdAt: number;
  lastActivity: number;
  subscribers: Set<Subscriber>;
  // Per-member timers scheduled when their last subscriber disconnects. If they
  // reconnect within the grace window, the timer is cancelled and they stay in
  // the room. Otherwise they're removed when the timer fires.
  pendingLeaves: Map<string, ReturnType<typeof setTimeout>>;
}

// Persist across Next.js hot-reloads in dev mode.
const g = global as typeof global & { _rooms?: Map<string, Room> };
if (!g._rooms) g._rooms = new Map<string, Room>();
const rooms = g._rooms;
// Migrate rooms that survived an HMR reload from before pendingLeaves existed.
rooms.forEach((r) => {
  if (!r.pendingLeaves) r.pendingLeaves = new Map();
});

function generateCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

function clearPendingLeaves(r: Room) {
  r.pendingLeaves.forEach((t) => clearTimeout(t));
  r.pendingLeaves.clear();
}

function gc(now: number) {
  rooms.forEach((r, code) => {
    const ttl = r.members.size === 0 ? EMPTY_ROOM_TTL_MS : ROOM_TTL_MS;
    if (now - r.lastActivity > ttl) {
      // Notify any straggler subscribers and drop the room.
      clearPendingLeaves(r);
      broadcast(r, { type: "closed", reason: "expired" });
      r.subscribers.clear();
      rooms.delete(code);
    }
  });
}

// Periodic GC tick. Empty rooms only expire via gc, so we can't rely on
// createRoom being called to flush them — schedule a low-frequency sweep.
const ggc = global as typeof global & { _roomGcInterval?: ReturnType<typeof setInterval> };
if (!ggc._roomGcInterval) {
  ggc._roomGcInterval = setInterval(() => gc(Date.now()), 5 * 60 * 1000);
  // Don't keep the process alive just for this.
  ggc._roomGcInterval.unref?.();
}

function snapshot(r: Room): RoomSnapshot {
  return {
    code: r.code,
    ownerSteamId: r.ownerSteamId,
    members: Array.from(r.members.values()),
    state: r.state,
    createdAt: r.createdAt,
  };
}

function broadcast(r: Room, event: RoomEvent) {
  r.subscribers.forEach((sub) => {
    try {
      sub.send(event);
    } catch {
      // Dead subscriber; drop it.
      r.subscribers.delete(sub);
    }
  });
}

function touch(r: Room) {
  r.lastActivity = Date.now();
}

// === public API ===

export function createRoom(owner: SteamSessionUser): RoomSnapshot {
  const now = Date.now();
  gc(now);
  let code: string;
  do {
    code = generateCode();
  } while (rooms.has(code));
  const member: RoomMember = { ...owner, joinedAt: now };
  const room: Room = {
    code,
    ownerSteamId: owner.steamId,
    members: new Map([[owner.steamId, member]]),
    state: { ...DEFAULT_STATE },
    createdAt: now,
    lastActivity: now,
    subscribers: new Set(),
    pendingLeaves: new Map(),
  };
  rooms.set(code, room);
  return snapshot(room);
}


export function getRoom(code: string): RoomSnapshot | null {
  const r = rooms.get(code.toUpperCase());
  return r ? snapshot(r) : null;
}

export function joinRoom(code: string, user: SteamSessionUser): RoomSnapshot | { error: string } {
  const r = rooms.get(code.toUpperCase());
  if (!r) return { error: "Room introuvable" };
  if (r.members.size >= MAX_MEMBERS && !r.members.has(user.steamId)) {
    return { error: "Room pleine" };
  }
  const member: RoomMember = { ...user, joinedAt: r.members.get(user.steamId)?.joinedAt ?? Date.now() };
  r.members.set(user.steamId, member);
  touch(r);
  broadcast(r, { type: "members", members: Array.from(r.members.values()) });
  return snapshot(r);
}

/**
 * Remove `steamId` from `code`'s member list.
 *
 * `deleteIfEmpty` controls what happens if this drops the room to zero members:
 *   true  — explicit leave (user clicked "Quitter"). Room is destroyed and any
 *           remaining subscribers receive `closed: "empty"`.
 *   false — grace-period expiry (user disconnected and never came back). Room
 *           is kept around for EMPTY_ROOM_TTL_MS so the user can reconnect via
 *           the URL after a reboot / longer absence.
 */
function removeMember(code: string, steamId: string, deleteIfEmpty: boolean): boolean {
  const r = rooms.get(code.toUpperCase());
  if (!r) return false;
  const t = r.pendingLeaves.get(steamId);
  if (t) {
    clearTimeout(t);
    r.pendingLeaves.delete(steamId);
  }
  const had = r.members.delete(steamId);
  if (!had) return false;
  if (r.members.size === 0) {
    if (deleteIfEmpty) {
      clearPendingLeaves(r);
      broadcast(r, { type: "closed", reason: "empty" });
      r.subscribers.clear();
      rooms.delete(r.code);
    } else {
      // Mark activity so the empty-room TTL clock starts now.
      touch(r);
      // No remaining subscribers to notify.
    }
    return true;
  }
  // Promote a new owner if the leaver was the owner.
  if (r.ownerSteamId === steamId) {
    const next = r.members.values().next().value as RoomMember | undefined;
    if (next) r.ownerSteamId = next.steamId;
  }
  touch(r);
  broadcast(r, { type: "members", members: Array.from(r.members.values()) });
  return true;
}

/** Explicit leave (button press / REST hop). Deletes the room when it empties. */
export function leaveRoom(code: string, steamId: string): boolean {
  return removeMember(code, steamId, /* deleteIfEmpty */ true);
}

/**
 * Schedule a grace-period removal of `steamId` from `code`. If the user
 * reconnects (and a new subscribe happens), call `cancelPendingLeave` to abort.
 * When the timer fires, the user is removed but the room is preserved so they
 * can come back to the same URL after a reboot. Returns false if the room or
 * member doesn't exist.
 */
export function schedulePendingLeave(code: string, steamId: string, graceMs: number): boolean {
  const r = rooms.get(code.toUpperCase());
  if (!r || !r.members.has(steamId)) return false;
  const existing = r.pendingLeaves.get(steamId);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    removeMember(r.code, steamId, /* deleteIfEmpty */ false);
  }, graceMs);
  r.pendingLeaves.set(steamId, timer);
  return true;
}

/** Cancel any pending grace-period leave for `steamId` in `code`. */
export function cancelPendingLeave(code: string, steamId: string): void {
  const r = rooms.get(code.toUpperCase());
  if (!r) return;
  const t = r.pendingLeaves.get(steamId);
  if (t) {
    clearTimeout(t);
    r.pendingLeaves.delete(steamId);
  }
}

export function mutateState(
  code: string,
  steamId: string,
  next: GauntletState,
): RoomSnapshot | { error: string } {
  const r = rooms.get(code.toUpperCase());
  if (!r) return { error: "Room introuvable" };
  if (!r.members.has(steamId)) return { error: "Pas membre de cette room" };
  r.state = next;
  touch(r);
  broadcast(r, { type: "state", state: next });
  return snapshot(r);
}

/** Subscribe an SSE stream. Caller MUST invoke the returned unsubscribe fn on close. */
export function subscribe(
  code: string,
  steamId: string,
  send: (event: RoomEvent) => void,
): { snapshot: RoomSnapshot; unsubscribe: () => void } | { error: string } {
  const r = rooms.get(code.toUpperCase());
  if (!r) return { error: "Room introuvable" };
  if (!r.members.has(steamId)) return { error: "Pas membre de cette room" };
  const sub: Subscriber = { steamId, send };
  r.subscribers.add(sub);
  touch(r);
  return {
    snapshot: snapshot(r),
    unsubscribe: () => {
      r.subscribers.delete(sub);
    },
  };
}
