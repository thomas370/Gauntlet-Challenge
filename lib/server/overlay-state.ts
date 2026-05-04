// Maps the rich GauntletState into the flat shape the Twitch overlay widgets
// expect (totalElapsed/startedAt timer fields, victories/goal/resets counters,
// games[] with status). The overlay HTML is intentionally not rewritten — the
// mapping lives here so the widget JS stays unchanged.

import { POOL } from "@/lib/games";
import type { GauntletState } from "@/lib/types";

export type OverlayGameStatus = "upcoming" | "current" | "completed";

export interface OverlayGame {
  id: number;
  name: string;
  player: string;
  duration: number;
  status: OverlayGameStatus;
}

export interface OverlayState {
  totalElapsed: number;
  startedAt: number | null;
  victories: number;
  goal: number;
  resets: number;
  currentGameId: number | null;
  currentGameStartedAt: number | null;
  currentGameElapsed: number;
  games: OverlayGame[];
}

const POOL_BY_ID = new Map(POOL.map((g) => [g.id, g]));

export function mapToOverlay(
  state: GauntletState,
  currentGameStartedAt: number | null,
  gameDurations: Record<number, number>,
): OverlayState {
  const currentGameId = state.run[state.current] ?? null;
  const doneSet = new Set(state.done);

  const games: OverlayGame[] = state.run.map((id, idx) => {
    const g = POOL_BY_ID.get(id);
    return {
      id,
      name: g?.name ?? `Game ${id}`,
      player: state.champions[id] ?? "",
      duration: gameDurations[id] ?? 0,
      status: doneSet.has(id)
        ? "completed"
        : idx === state.current
          ? "current"
          : "upcoming",
    };
  });

  return {
    totalElapsed: 0,
    startedAt: state.runStartTime,
    victories: state.done.length,
    goal: state.run.length || 10,
    resets: Math.max(0, state.attempt - 1),
    currentGameId,
    currentGameStartedAt: currentGameId !== null ? currentGameStartedAt : null,
    currentGameElapsed: 0,
    games,
  };
}
