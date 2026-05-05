// Multiplayer room types — shared between server and client.

import type { GauntletState } from "../types";
import type { SteamSessionUser } from "./steam";

export interface RoomMember extends SteamSessionUser {
  joinedAt: number;
}

export interface RoomSnapshot {
  code: string;
  ownerSteamId: string;
  members: RoomMember[];
  state: GauntletState;
  createdAt: number;
}

/**
 * Server→client SSE event payloads.
 * `state` is sent on connect (full snapshot) and after every mutation.
 * `members` is sent on connect and whenever the membership changes.
 * `closed` notifies clients the room has been deleted.
 */
export type RoomEvent =
  | { type: "state"; state: GauntletState }
  | { type: "members"; members: RoomMember[] }
  | { type: "closed"; reason?: string };
