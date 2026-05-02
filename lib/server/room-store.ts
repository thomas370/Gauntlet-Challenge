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
const ROOM_TTL_MS = 12 * 60 * 60 * 1000; // 12h since last activity
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
}

const rooms = new Map<string, Room>();

function generateCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

function gc(now: number) {
  rooms.forEach((r, code) => {
    if (now - r.lastActivity > ROOM_TTL_MS) {
      // Notify subscribers and drop the room.
      broadcast(r, { type: "closed", reason: "expired" });
      r.subscribers.clear();
      rooms.delete(code);
    }
  });
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

export function leaveRoom(code: string, steamId: string): boolean {
  const r = rooms.get(code.toUpperCase());
  if (!r) return false;
  const had = r.members.delete(steamId);
  if (!had) return false;
  if (r.members.size === 0) {
    broadcast(r, { type: "closed", reason: "empty" });
    r.subscribers.clear();
    rooms.delete(r.code);
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
