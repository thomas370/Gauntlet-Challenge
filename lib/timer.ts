"use client";

const PB_KEY = "gauntlet_pb_v1";

export interface RunRecord {
  totalMs: number;
  perGame: Record<number, number>;
  difficulty: "normal" | "hardcore";
  attempt: number;
  date: string;
}

export interface PBState {
  best?: RunRecord;
  bestHardcore?: RunRecord;
  history: RunRecord[];
}

export function loadPB(): PBState {
  if (typeof window === "undefined") return { history: [] };
  try {
    const raw = localStorage.getItem(PB_KEY);
    if (!raw) return { history: [] };
    return JSON.parse(raw);
  } catch {
    return { history: [] };
  }
}

export function savePB(state: PBState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PB_KEY, JSON.stringify(state));
  } catch {}
}

export function recordRun(record: RunRecord): { newPB: boolean; previousBest?: RunRecord } {
  const state = loadPB();
  const isHC = record.difficulty === "hardcore";
  const currentBest = isHC ? state.bestHardcore : state.best;
  const newPB = !currentBest || record.totalMs < currentBest.totalMs;

  if (newPB) {
    if (isHC) state.bestHardcore = record;
    else state.best = record;
  }
  state.history = [record, ...(state.history ?? [])].slice(0, 20);
  savePB(state);

  return { newPB, previousBest: currentBest };
}

export function formatTime(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
