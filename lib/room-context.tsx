"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { type GauntletState } from "@/lib/types";

type RoomCtx = {
  roomCode: string | null;
  isHost: boolean;
  myName: string;
  players: string[];
  connecting: boolean;
  initialGameState: GauntletState | null;
  createRoom: (name: string) => void;
  joinRoom: (code: string, name: string) => void;
  leaveRoom: () => void;
  startGame: () => void;
  setInitialGameState: (s: GauntletState | null) => void;
};

const Ctx = createContext<RoomCtx | null>(null);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [myName, setMyName] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [initialGameState, setInitialGameState] = useState<GauntletState | null>(null);
  const router = useRouter();
  const roomCodeRef = useRef(roomCode);
  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);

  useEffect(() => {
    const socket = getSocket();

    socket.on("room_created", ({ code, state }: { code: string; state: GauntletState }) => {
      setRoomCode(code);
      setIsHost(true);
      setPlayers(state.players.filter(Boolean));
      setConnecting(false);
      router.push(`/room/${code}`);
    });

    socket.on("room_joined", ({ code, state }: { code: string; state: GauntletState }) => {
      setRoomCode(code);
      setIsHost(false);
      setPlayers(state.players.filter(Boolean));
      setConnecting(false);
      router.push(`/room/${code}`);
    });

    socket.on("room_update", ({ players: pl, state }: { players: string[]; state: GauntletState }) => {
      setPlayers(pl.filter(Boolean));
      // Keep initialGameState up-to-date before game starts (players list may change)
      setInitialGameState(state);
    });

    socket.on("host_assigned", () => {
      setIsHost(true);
    });

    socket.on("game_started", ({ code, state }: { code: string; state: GauntletState }) => {
      setInitialGameState(state);
      router.push(`/game/${code}`);
    });

    socket.on("room_error", ({ message }: { message: string }) => {
      alert(message);
      setConnecting(false);
    });

    return () => {
      socket.off("room_created");
      socket.off("room_joined");
      socket.off("room_update");
      socket.off("host_assigned");
      socket.off("game_started");
      socket.off("room_error");
    };
  }, [router]);

  const createRoom = (name: string) => {
    if (!name.trim()) return;
    setMyName(name.trim());
    setConnecting(true);
    getSocket().emit("create_room", { name: name.trim() });
  };

  const joinRoom = (code: string, name: string) => {
    if (!code.trim() || !name.trim()) return;
    setMyName(name.trim());
    setConnecting(true);
    getSocket().emit("join_room", { code: code.trim().toUpperCase(), name: name.trim() });
  };

  const leaveRoom = () => {
    getSocket().emit("leave_room");
    setRoomCode(null);
    setIsHost(false);
    setMyName("");
    setPlayers([]);
    setInitialGameState(null);
    router.push("/");
  };

  const startGame = () => {
    const code = roomCodeRef.current;
    if (!code || !isHost) return;
    getSocket().emit("start_game", { code });
  };

  return (
    <Ctx.Provider value={{
      roomCode, isHost, myName, players, connecting, initialGameState,
      createRoom, joinRoom, leaveRoom, startGame, setInitialGameState,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRoom(): RoomCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRoom must be used inside <RoomProvider>");
  return ctx;
}
