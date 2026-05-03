// Cascading ownership resolver:
//   1. GetPlayerSummaries → check communityvisibilitystate (cached 5 min)
//   2. Public profile → GetOwnedGames (authoritative)
//   3. Private profile → community XML feed
//   4. Any unresolved or "would be false" appId → free-to-play check.
//      Free games are treated as `owned: true` (anyone can grab them).
//   5. Otherwise mark as `unknown` (NOT `false`)

import { cache } from "./cache";
import { getOwnedGames, getPlayerSummary } from "./steam-api";
import { fetchOwnedAppIdsFromXml, isFreeToPlay } from "./steam-fallback";
import type {
  OwnershipResult,
  SteamOwnedGame,
  SteamPlayerSummary,
} from "@/lib/types/steam";

const OWN_TTL = 600; // 10 min per spec
const FREE_CACHE_TTL = 24 * 60 * 60; // is-free is global + very stable → 24h

interface ResolveOptions {
  steamId: string;
  appIds: number[];
  refresh?: boolean; // bypass per-(steamId,appId) cache
}

/** Cached, parallelizable wrapper around `isFreeToPlay`. Cache is global (no steamId in key). */
async function resolveFree(appId: number): Promise<boolean | null> {
  const key = `free:${appId}`;
  const hit = cache.get<boolean | null>(key);
  if (hit !== undefined) return hit;
  const free = await isFreeToPlay(appId);
  cache.set(key, free, free === null ? 60 : FREE_CACHE_TTL);
  return free;
}

/**
 * Returns a map keyed by appId → OwnershipResult. Each entry is independently cached.
 * Pulls the global summary + owned-games list at most once per call.
 */
export async function resolveOwnership(
  opts: ResolveOptions,
): Promise<Map<number, OwnershipResult>> {
  const { steamId, appIds, refresh } = opts;
  const out = new Map<number, OwnershipResult>();

  // 1. Serve fully from cache when possible.
  const missing: number[] = [];
  if (!refresh) {
    for (const id of appIds) {
      const hit = cache.get<OwnershipResult>(`owns:${steamId}:${id}`);
      if (hit) out.set(id, hit);
      else missing.push(id);
    }
  } else {
    missing.push(...appIds);
  }
  if (missing.length === 0) return out;

  // 2. Profile summary (used for the publicProfile field on every result).
  const summary = await getPlayerSummary(steamId);
  const publicProfile = summary
    ? { displayName: summary.personaname, avatarUrl: summary.avatarfull }
    : undefined;

  // 3. Try GetOwnedGames regardless of communityvisibilitystate. The "game
  //    details" privacy setting is independent from the profile-visibility
  //    setting — Steam can return a full library for a friends-only profile,
  //    and an empty response for a public one. So we always try, and use the
  //    response itself as the signal:
  //      - non-empty → authoritative for everything in the library
  //      - empty     → library is hidden from us; treat as "no signal" and
  //                    fall through to the XML / free-to-play fallbacks
  //                    (instead of stamping every game as `owned: false`).
  let apiGames: Map<number, SteamOwnedGame> | null = null;
  const games = await getOwnedGames(steamId);
  if (games.length > 0) {
    apiGames = new Map(games.map((g) => [g.appid, g]));
  }

  // 4. First pass: resolve everything we can confirm directly. Track tentative-false
  //    appIds (per-source) and unresolved (no signal yet) for the free-game override.
  const tentativeFalse: { id: number; falseSource: "api" | "fallback_xml" }[] = [];
  const stillUnresolved: number[] = [];

  for (const id of missing) {
    if (apiGames && apiGames.has(id)) {
      const r = ownedFromApi(steamId, apiGames.get(id)!, summary);
      out.set(id, r);
      cache.set(`owns:${steamId}:${id}`, r, OWN_TTL);
    } else if (apiGames) {
      tentativeFalse.push({ id, falseSource: "api" });
    } else {
      stillUnresolved.push(id);
    }
  }

  // 5. Fallback 1 — community XML feed (only if we hadn't seen the library at all).
  if (stillUnresolved.length > 0) {
    const xmlIds = await fetchOwnedAppIdsFromXml(steamId);
    for (const id of stillUnresolved.splice(0)) {
      if (xmlIds && xmlIds.has(id)) {
        const r: OwnershipResult = {
          owned: true,
          steamId,
          source: "fallback_xml",
          game: { appId: id },
          publicProfile,
        };
        out.set(id, r);
        cache.set(`owns:${steamId}:${id}`, r, OWN_TTL);
      } else if (xmlIds) {
        tentativeFalse.push({ id, falseSource: "fallback_xml" });
      } else {
        stillUnresolved.push(id); // profile fully invisible
      }
    }
  }

  // 6. Free-to-play override. Anyone can grab a free game, so we treat it as owned: true.
  //    Run all is-free lookups in parallel, then apply.
  const freeCandidates = [
    ...tentativeFalse.map((t) => t.id),
    ...stillUnresolved,
  ];
  const freeMap = new Map<number, boolean | null>();
  if (freeCandidates.length > 0) {
    const results = await Promise.all(
      freeCandidates.map((id) => resolveFree(id).then((free) => [id, free] as const)),
    );
    for (const [id, free] of results) freeMap.set(id, free);
  }

  // 6a. Tentative-false → either flipped to free (owned: true) or genuinely false.
  for (const { id, falseSource } of tentativeFalse) {
    const free = freeMap.get(id);
    const r: OwnershipResult =
      free === true
        ? {
            owned: true,
            steamId,
            source: "free_to_play",
            reason: "free_to_play",
            game: { appId: id },
            publicProfile,
          }
        : { owned: false, steamId, source: falseSource, publicProfile };
    out.set(id, r);
    cache.set(`owns:${steamId}:${id}`, r, OWN_TTL);
  }

  // 6b. Fully unresolved (private profile, no XML) → free → true, else unknown.
  for (const id of stillUnresolved) {
    const free = freeMap.get(id);
    const r: OwnershipResult =
      free === true
        ? {
            owned: true,
            steamId,
            source: "free_to_play",
            reason: "free_to_play",
            game: { appId: id },
            publicProfile,
          }
        : { owned: "unknown", steamId, source: "unknown", reason: "profile_private", publicProfile };
    out.set(id, r);
    // Free results stay cached longer; unknowns expire fast so a privacy-flip flows through.
    cache.set(`owns:${steamId}:${id}`, r, free === true ? OWN_TTL * 6 : 60);
  }

  return out;
}

function ownedFromApi(
  steamId: string,
  g: SteamOwnedGame,
  summary: SteamPlayerSummary | null,
): OwnershipResult {
  return {
    owned: true,
    steamId,
    source: "api",
    game: {
      appId: g.appid,
      name: g.name,
      playtimeHours: Math.round((g.playtime_forever / 60) * 10) / 10,
      lastPlayed: g.rtime_last_played
        ? new Date(g.rtime_last_played * 1000).toISOString().slice(0, 10)
        : undefined,
    },
    publicProfile: summary
      ? { displayName: summary.personaname, avatarUrl: summary.avatarfull }
      : undefined,
  };
}
