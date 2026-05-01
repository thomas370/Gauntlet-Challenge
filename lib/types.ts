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
}

export type Difficulty = "normal" | "hardcore";
export type PenaltyMode = "reset" | "stepback";

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
};
