export type GameMode = "team" | "solo" | "duo";

export interface Game {
  id: number;
  name: string;
  cat: string;
  mode: GameMode;
  normal: string;
  hardcore: string;
  /** If true, this game becomes solo-mode only when difficulty === 'hardcore'. */
  soloHardcore?: boolean;
  /** Steam App ID for cover art. Leave undefined for non-Steam games. */
  appid?: number;
  /** Custom cover URL (overrides appid). Used for non-Steam games. */
  cover?: string;
}

export type Difficulty = "normal" | "hardcore";
export type PenaltyMode = "reset" | "stepback";

export interface RunHistoryEntry {
  id: number;
  ts: number;
  outcome: "win" | "lose";
  attempts: number;
  duration: number;
  difficulty: Difficulty;
  penaltyMode: PenaltyMode;
  runIds: number[];
  failedGameId: number | null;
  championPicks: Record<number, string>;
  completed: number;
  total: number;
}

export interface GauntletState {
  attempt: number;
  current: number;
  difficulty: Difficulty;
  penaltyMode: PenaltyMode;
  players: string[];
  playerCount: number;
  pinned: number[];
  run: number[];
  champions: Record<number, string>;
  done: number[];
  filter: string;
  search: string;
  soundEnabled: boolean;
  showHistory: boolean;
  runStartTime: number | null;
  runFails: Record<number, number>;
  history: RunHistoryEntry[];
}

export const DEFAULT_STATE: GauntletState = {
  attempt: 1,
  current: 0,
  difficulty: "normal",
  penaltyMode: "reset",
  players: ["Thomas", "Mathis", "TheFable"],
  playerCount: 3,
  pinned: [],
  run: [],
  champions: {},
  done: [],
  filter: "all",
  search: "",
  soundEnabled: true,
  showHistory: false,
  runStartTime: null,
  runFails: {},
  history: [],
};
