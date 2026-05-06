// Steam Web API + OpenID response shapes.

export interface SteamSessionUser {
  steamId: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
}

/** Guest sessions reuse SteamSessionUser; their `steamId` is prefixed with `g_`
 *  so callers can short-circuit Steam-only features (ownership lookup, profile
 *  page, etc.) without changing the session shape. */
export const GUEST_ID_PREFIX = "g_";

export function isGuestId(id: string | null | undefined): boolean {
  return typeof id === "string" && id.startsWith(GUEST_ID_PREFIX);
}

/** Bot members are added by humans for testing or for filling out a draw when
 *  there aren't enough real players. They have no session, no Steam library,
 *  no profile — just a synthetic id and a chosen display name. */
export const BOT_ID_PREFIX = "bot_";

export function isBotId(id: string | null | undefined): boolean {
  return typeof id === "string" && id.startsWith(BOT_ID_PREFIX);
}

/** Convenience: true for any non-Steam id (guest or bot). Use this when the
 *  decision is "do we have a real Steam profile to query?" rather than "is this
 *  a real human?". */
export function isSyntheticId(id: string | null | undefined): boolean {
  return isGuestId(id) || isBotId(id);
}

export type CommunityVisibility = 1 | 2 | 3; // 1/2 = private/friends, 3 = public

export interface SteamPlayerSummary {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  communityvisibilitystate: CommunityVisibility;
  profilestate?: number;
  lastlogoff?: number;
  personastate?: number;
}

export interface SteamOwnedGame {
  appid: number;
  name?: string;
  playtime_forever: number; // minutes
  img_icon_url?: string;
  rtime_last_played?: number; // unix seconds
  has_community_visible_stats?: boolean;
  playtime_2weeks?: number;
}

export interface GetOwnedGamesResponse {
  response: {
    game_count?: number;
    games?: SteamOwnedGame[];
  };
}

export interface GetPlayerSummariesResponse {
  response: { players: SteamPlayerSummary[] };
}

export type OwnershipSource = "api" | "fallback_xml" | "free_to_play" | "unknown";

export interface OwnershipResult {
  owned: boolean | "likely" | "unknown";
  steamId: string;
  source: OwnershipSource;
  reason?: "profile_private" | "free_to_play" | "appid_not_found";
  game?: {
    appId: number;
    name?: string;
    playtimeHours?: number;
    lastPlayed?: string; // ISO date
  };
  publicProfile?: {
    displayName: string;
    avatarUrl: string;
  };
}

export interface BatchOwnershipResult {
  steamId: string;
  source: OwnershipSource;
  reason?: OwnershipResult["reason"];
  results: Record<string, boolean | "unknown">;
}
