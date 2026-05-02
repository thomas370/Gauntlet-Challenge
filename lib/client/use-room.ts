// Client-side hook that mirrors a useState<GauntletState> API while keeping the
// room state in sync with the server via Server-Sent Events.
//
// The signature of `setState` matches React's setState dispatcher exactly, so the
// existing gauntlet code can call setState((s) => ...) or setState(value) without
// changes. Each call applies optimistically locally AND POSTs the new state to
// the server, which broadcasts it back to every other subscriber.

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

  // Holds the most recent state to push when batching mutations. Currently we send
  // each mutation immediately, but a ref leaves room for a debounce later.
  const lastSent = useRef<GauntletState | null>(null);

  useEffect(() => {
    if (!code) return;
    const es = new EventSource(`/api/room/${code}/stream`);

    const handle = (raw: MessageEvent) => {
      try {
        const event = JSON.parse(raw.data) as RoomEvent;
        if (event.type === "state") {
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
      setLocalState((prev) => {
        const next =
          typeof value === "function"
            ? (value as (s: GauntletState) => GauntletState)(prev)
            : value;
        // Avoid re-broadcasting unchanged state (cheap reference check first).
        if (next !== prev && next !== lastSent.current) {
          lastSent.current = next;
          fetch(`/api/room/${code}/mutate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ state: next }),
          }).catch(() => {});
        }
        return next;
      });
    },
    [code],
  );

  return { state, setState, members, connected, closed };
}
