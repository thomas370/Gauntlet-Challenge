// Client-side hook that mirrors a useState<GauntletState> API while keeping the
// room state in sync with the server via Server-Sent Events.
//
// Each setState call:
//   1. Applies the change locally (instant, optimistic)
//   2. POSTs the new state to the server, which broadcasts it to every subscriber
//
// Design notes:
// - stateRef holds the *synchronous* latest state so consecutive setState calls
//   always compute from the most recent value, not a stale React closure.
// - fetch is called OUTSIDE the React updater function (React can call updaters
//   more than once in Strict Mode / concurrent mode — side effects must not live there).

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_STATE, type GauntletState } from "@/lib/types";
import type { RoomEvent, RoomMember } from "@/lib/types/room";

export interface UseRoomResult {
  state: GauntletState;
  setState: React.Dispatch<React.SetStateAction<GauntletState>>;
  members: RoomMember[];
  connected: boolean;
  closed: string | null;
}

export function useRoom(code: string): UseRoomResult {
  const [state, setLocalState] = useState<GauntletState>(DEFAULT_STATE);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [connected, setConnected] = useState(false);
  const [closed, setClosed] = useState<string | null>(null);

  // Synchronous mirror of the React state — lets consecutive setState calls
  // each read the freshest value without waiting for a re-render.
  const stateRef = useRef<GauntletState>(DEFAULT_STATE);
  // Tracks what we last pushed to the server so we don't re-broadcast our
  // own SSE echo back.
  const lastSent = useRef<GauntletState | null>(null);

  useEffect(() => {
    if (!code) return;
    const es = new EventSource(`/api/room/${code}/stream`);

    const handle = (raw: MessageEvent) => {
      try {
        const event = JSON.parse(raw.data) as RoomEvent;
        if (event.type === "state") {
          stateRef.current = event.state;
          setLocalState(event.state);
        } else if (event.type === "members") {
          setMembers(event.members);
        } else if (event.type === "closed") {
          setClosed(event.reason ?? "closed");
          es.close();
        }
      } catch {
        /* ignore malformed event */
      }
    };

    es.addEventListener("state", handle);
    es.addEventListener("members", handle);
    es.addEventListener("closed", handle);
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    return () => {
      es.close();
    };
  }, [code]);

  const setState = useCallback<React.Dispatch<React.SetStateAction<GauntletState>>>(
    (value) => {
      // Compute next state synchronously — no stale closures.
      const prev = stateRef.current;
      const next =
        typeof value === "function"
          ? (value as (s: GauntletState) => GauntletState)(prev)
          : value;

      if (next === prev) return; // pure no-op — skip everything

      // 1. Apply locally (optimistic)
      stateRef.current = next;
      setLocalState(next);

      // 2. Broadcast to server (skip if this is an echo of what we just sent)
      if (next !== lastSent.current) {
        lastSent.current = next;
        fetch(`/api/room/${code}/mutate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: next }),
        }).catch((err) => {
          console.warn("[room] mutate failed:", err);
        });
      }
    },
    [code],
  );

  return { state, setState, members, connected, closed };
}
