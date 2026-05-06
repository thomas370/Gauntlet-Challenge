// Public stats API shapes — shared between server (queries) and client (pages).
//
// All fields are public-info: Steam IDs and display names are public on Steam
// itself, and runs aggregate that public info plus gameplay outcomes. No auth
// is required to read these endpoints.

import type { Difficulty, PenaltyMode } from "../types";

export interface ProfilePlayer {
  steamId: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
}

export interface ProfileStats {
  totalRuns: number;
  wins: number;
  losses: number;
  /** wins / totalRuns — null when totalRuns is 0. */
  winRate: number | null;
  /** Fastest winning run in seconds, any difficulty. Null if never won. */
  fastestWinSeconds: number | null;
  fastestHardcoreWinSeconds: number | null;
  /** Game where this player has failed the most often. Null if never lost. */
  mostFearedGame: { gameId: number; failCount: number } | null;
}

export interface ProfileRunPlayer {
  steamId: string;
  displayName: string;
  avatarUrl: string;
}

export interface ProfileRun {
  id: number;
  endedAt: number;
  outcome: "win" | "lose";
  difficulty: Difficulty;
  penaltyMode: PenaltyMode;
  attempts: number;
  completed: number;
  total: number;
  failedGameId: number | null;
  durationSeconds: number;
  players: ProfileRunPlayer[];
}

export interface ProfilePayload {
  player: ProfilePlayer;
  stats: ProfileStats;
  recentRuns: ProfileRun[];
}

// === Leaderboards ===

export interface LeaderboardRun {
  id: number;
  endedAt: number;
  durationSeconds: number;
  difficulty: Difficulty;
  players: ProfileRunPlayer[];
}

export interface LeaderboardPlayer {
  steamId: string;
  displayName: string;
  avatarUrl: string;
  value: number;
}

export interface LeaderboardsPayload {
  fastestWins: {
    all: LeaderboardRun[];
    normal: LeaderboardRun[];
    hardcore: LeaderboardRun[];
  };
  mostWins: LeaderboardPlayer[];
  longestStreak: LeaderboardPlayer[];
  mostRuns: LeaderboardPlayer[];
}

// === Per-game stats ===

export interface GameStats {
  gameId: number;
  /** Times this game appeared in someone's draw (drawn but not necessarily played). */
  drawn: number;
  /** Times the game was actually completed in a run. */
  completed: number;
  /** Times this game was the failure point of a run (= runs.failed_game_id). */
  failed: number;
  /** Average completion time over `completed` entries. Null when never cleared. */
  avgDurationSeconds: number | null;
}

export interface GameStatsPayload {
  /** Total runs in the database — denominator for "draw frequency" if needed. */
  totalRuns: number;
  games: GameStats[];
}
