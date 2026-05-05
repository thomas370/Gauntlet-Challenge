// Fallbacks when GetOwnedGames returns empty (private profile).
//
// 1. Community XML feed — also respects privacy, but sometimes works when the API doesn't.
// 2. Store appdetails — only tells us if the game is free-to-play, which we treat as
//    "owned: likely" (anyone can grab a free game, so ownership is a soft truth).

import { XMLParser } from "fast-xml-parser";
import { HttpError } from "./auth";

const TIMEOUT_MS = 10_000;

async function safeFetch(url: string): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw new HttpError(502, "Steam fallback timeout");
    throw new HttpError(502, "Steam fallback unreachable");
  } finally {
    clearTimeout(timer);
  }
}

const xmlParser = new XMLParser({ ignoreAttributes: true, parseTagValue: true });

/**
 * Returns the set of appIds visible in the user's community XML feed,
 * or null if the feed itself is private/empty.
 */
export async function fetchOwnedAppIdsFromXml(steamId: string): Promise<Set<number> | null> {
  const url = `https://steamcommunity.com/profiles/${steamId}/games?xml=1`;
  const res = await safeFetch(url);
  if (!res.ok) return null;
  const text = await res.text();
  // Steam returns an HTML error page with status 200 if profile is private — sniff for <gamesList>.
  if (!text.includes("<gamesList")) return null;

  const parsed = xmlParser.parse(text) as {
    gamesList?: { games?: { game?: unknown } };
  };
  const gamesNode = parsed.gamesList?.games?.game;
  if (!gamesNode) return null;
  const arr = Array.isArray(gamesNode) ? gamesNode : [gamesNode];
  const ids = new Set<number>();
  for (const g of arr) {
    const id = Number((g as { appID?: number | string }).appID);
    if (!Number.isNaN(id)) ids.add(id);
  }
  return ids.size > 0 ? ids : null;
}

/** Returns true if the appId is a free-to-play game on Steam. */
export async function isFreeToPlay(appId: number): Promise<boolean | null> {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&filters=basic`;
  const res = await safeFetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as Record<string, { success: boolean; data?: { is_free?: boolean } }>;
  const entry = data[String(appId)];
  if (!entry?.success) return null;
  return Boolean(entry.data?.is_free);
}
