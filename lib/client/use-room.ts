// Client-side hook — mirrors useState<GauntletState> while keeping the room
// in sync via Socket.io (replaces the old SSE + REST-mutate approach).
//
// Flow:
//   connect  → emit "join" { code }
//            ← receive "state" + "members" (initial snapshot)
//   setState → emit "mutate" { state }  (server broadcasts to all)
//            ← receive "state"           (echo + other players)
//   unmount  → emit "leave" + disconnect

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
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

  // Synchronous mirror — lets consecutive setState calls always read the
  // freshest value without waiting for a React re-render.
  const stateRef = useRef<GauntletState>(DEFAULT_STATE);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!code) return;

    const socket: Socket = io({
      // Same origin, default /socket.io/ path — no extra config needed.
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join", { code });
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("state", (event: Extract<RoomEvent, { type: "state" }>) => {
      stateRef.current = event.state;
      setLocalState(event.state);
    });

    socket.on("members", (event: Extract<RoomEvent, { type: "members" }>) => {
      setMembers(event.members);
    });

    socket.on("closed", (event: Extract<RoomEvent, { type: "closed" }>) => {
      setClosed(event.reason ?? "closed");
      socket.disconnect();
    });

    socket.on("room_error", ({ message }: { message: string }) => {
      console.warn("[room] server error:", message);
    });

    return () => {
      socket.emit("leave");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [code]);

  const setState = useCallback<React.Dispatch<React.SetStateAction<GauntletState>>>(
    (value) => {
      const prev = stateRef.current;
      const next =
        typeof value === "function"
          ? (value as (s: GauntletState) => GauntletState)(prev)
          : value;

      if (next === prev) return; // no-op

      // 1. Optimistic local update (instant UI)
      stateRef.current = next;
      setLocalState(next);

      // 2. Push to server — broadcasts to every member including us
      socketRef.current?.emit("mutate", { state: next });
    },
    [],
  );

  return { state, setState, members, connected, closed };
}
