// Apply viewer-triggered effects to the streamer's active room.
//
// Each effect handler is a pure transform `(state) => nextState | null`. Returning
// null means the effect doesn't apply right now (no run, power-ups disabled,
// pool exhausted, etc.) — the caller refunds channel points or drops the bits
// cheer. Returning a new state means the effect applies; applyToRoom() handles
// the broadcast + per-game timing capture + history persistence as usual.

import { POOL } from "@shared/games";
import type { GauntletState, RunHistoryEntry } from "@shared/types";
import { applyToRoom, findUserRoomCode } from "./room-store";
import type { EffectKey } from "./twitch-effects";

export type EffectFailReason =
  | "no_link"
  | "no_active_room"
  | "no_change"
  | "not_applicable";

export interface EffectInvocation {
  effectKey: EffectKey;
  source: "channel_points" | "bits";
  steamId: string;
  triggeredBy: { userLogin: string; userName: string };
}

export type EffectOutcome =
  | { applied: true; effectKey: EffectKey }
  | { applied: false; reason: EffectFailReason };

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function appendHistoryEntry(
  s: GauntletState,
  outcome: "win" | "lose",
  failedGameId: number | null,
): RunHistoryEntry[] {
  if (!s.runStartTime) return s.history;
  const now = Date.now();
  const entry: RunHistoryEntry = {
    id: now,
    ts: now,
    outcome,
    attempts: s.attempt,
    duration: now - s.runStartTime, // milliseconds — recordRun normalizes to seconds.
    difficulty: s.difficulty,
    penaltyMode: s.penaltyMode,
    runIds: [...s.run],
    failedGameId,
    championPicks: { ...s.champions },
    completed: s.done.length,
    total: s.run.length,
  };
  return [entry, ...(s.history || [])].slice(0, 50);
}

const TRANSFORMS: Record<EffectKey, (s: GauntletState) => GauntletState | null> = {
  reroll: (s) => {
    if (s.runStartTime === null || s.run.length === 0) return null;
    if (s.current >= s.run.length) return null;
    const currentGameId = s.run[s.current];
    if (s.done.includes(currentGameId)) return null;
    const used = new Set(s.run);
    const candidates = POOL.filter((g) => !used.has(g.id));
    if (candidates.length === 0) return null;
    const newGame = pickRandom(candidates);
    const newRun = [...s.run];
    newRun[s.current] = newGame.id;
    const newPinned = s.pinned.filter((x) => x !== currentGameId);
    const newChampions = { ...s.champions };
    delete newChampions[currentGameId];
    return { ...s, run: newRun, pinned: newPinned, champions: newChampions };
  },

  shield: (s) => {
    if (s.runStartTime === null) return null;
    if (s.powerUpsEnabled === false) return null;
    if (s.shieldActive) return null; // already active — don't waste the redemption
    return { ...s, shieldActive: true };
  },

  skip: (s) => {
    if (s.runStartTime === null || s.run.length === 0) return null;
    if (s.current >= s.run.length) return null;
    const currentGameId = s.run[s.current];
    if (s.done.includes(currentGameId)) return null;
    const newDone = [...s.done, currentGameId];
    const newCurrent = s.current + 1;
    let next: GauntletState = { ...s, done: newDone, current: newCurrent };
    if (newDone.length === s.run.length) {
      // Gauntlet completed via skip — append a win entry so /u + leaderboards
      // record it. Note: client-side win celebration (confetti/overlay) won't
      // fire on this code path; that's a Phase 4 polish item.
      next = { ...next, history: appendHistoryEntry(next, "win", null) };
    }
    return next;
  },

  force_pin: (s) => {
    // Only applies when the team hasn't generated a run yet, so the pin
    // actually shapes the upcoming draw.
    if (s.run.length > 0) return null;
    if (s.pinned.length >= 5) return null;
    const used = new Set(s.pinned);
    const candidates = POOL.filter((g) => !used.has(g.id));
    if (candidates.length === 0) return null;
    const newGame = pickRandom(candidates);
    return { ...s, pinned: [...s.pinned, newGame.id] };
  },

  gift_joker: (s) => {
    if (s.powerUpsEnabled === false) return null;
    const targets = Object.keys(s.powerUps ?? {});
    if (targets.length === 0) return null;
    const winnerSteamId = pickRandom(targets);
    const current = s.powerUps[winnerSteamId] ?? { joker: 0, shield: 0, reroll: 0 };
    return {
      ...s,
      powerUps: {
        ...s.powerUps,
        [winnerSteamId]: { ...current, joker: current.joker + 1 },
      },
    };
  },
};

/**
 * Apply an effect to the streamer's most-recently-active room.
 * Returns the outcome so the caller can fulfill or refund a channel-point redemption.
 */
export function applyEffect(inv: EffectInvocation): EffectOutcome {
  const code = findUserRoomCode(inv.steamId);
  if (!code) return { applied: false, reason: "no_active_room" };

  const transform = TRANSFORMS[inv.effectKey];
  const result = applyToRoom(code, transform);

  if (result.applied) {
    console.log(
      `[twitch-effects] ${inv.effectKey} (${inv.source}) by ${inv.triggeredBy.userLogin} → applied to ${code}`,
    );
    return { applied: true, effectKey: inv.effectKey };
  }
  console.log(
    `[twitch-effects] ${inv.effectKey} (${inv.source}) by ${inv.triggeredBy.userLogin} → ${result.reason}`,
  );
  return {
    applied: false,
    reason: result.reason as EffectFailReason,
  };
}

