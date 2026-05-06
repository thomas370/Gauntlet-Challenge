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
  /** True for games whose objective is timed — surfaces a player-set countdown
   *  on the current game tile, synced across all clients in the room. */
  timer?: boolean;
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

export interface SteamLink {
  steamId: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
}

export interface PowerUp {
  joker: number;   // swaps remaining
  shield: number;  // shields remaining
  reroll: number;  // champion re-draws remaining
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
  // Absolute ms epoch when the per-game countdown expires (for games with
  // `timer: true`). Null when no countdown is running. Reset to null on every
  // game advance / loss / reset so it doesn't leak into the next game.
  timerDeadline: number | null;
  runFails: Record<number, number>;
  history: RunHistoryEntry[];
  steamLinks: Record<number, SteamLink>;
  powerUps: Record<string, PowerUp>; // steamId → remaining power-ups
  shieldActive: boolean;             // true = next defeat is negated
  powerUpsEnabled: boolean;          // whether the power-up system is active
  // Per-member Steam ownership for the games in the current run.
  // Outer key: steamId. Inner key: appid (as string, JSON-safe). Value:
  // true=owned, false=not owned. Absent means "unknown / not yet checked".
  ownership: Record<string, Record<string, boolean>>;
  // Manual claims (or denials) made by clicking your own chip. Always wins
  // over `ownership` for the UI. Used to override Steam when the API can't
  // see a private library or the user just wants to assert ownership.
  ownershipOverride: Record<string, Record<string, boolean>>;
}

export const DEFAULT_STATE: GauntletState = {
  attempt: 1,
  current: 0,
  difficulty: "normal",
  penaltyMode: "reset",
  players: [],
  playerCount: 0,
  pinned: [],
  run: [],
  champions: {},
  done: [],
  filter: "all",
  search: "",
  soundEnabled: true,
  showHistory: false,
  runStartTime: null,
  timerDeadline: null,
  runFails: {},
  history: [],
  steamLinks: {},
  powerUps: {},
  shieldActive: false,
  powerUpsEnabled: true,
  ownership: {},
  ownershipOverride: {},
};
