// Provision and reconcile Twitch custom rewards for one broadcaster.
//
// Helix API: https://api.twitch.tv/helix/channel_points/custom_rewards
//   - GET   ?broadcaster_id=X&only_manageable_rewards=true  (rewards owned by us)
//   - POST  body { title, cost, prompt, is_enabled, ... }
//   - PATCH ?id=…&broadcaster_id=…
//   - DELETE?id=…&broadcaster_id=…
//
// Affiliate-or-above is required to create channel-point rewards. If the
// streamer is below Affiliate, Helix returns 403 "broadcaster_not_partner_or_
// affiliate" and we degrade gracefully — the EventSub manager still subscribes
// to bits cheers; channel-point effects are simply unavailable until they
// reach Affiliate.

import { env } from "./env";
import {
  CHANNEL_POINT_EFFECTS,
  EFFECTS,
  type EffectDefinition,
  type EffectKey,
} from "./twitch-effects";
import {
  deleteRewardsForBroadcaster,
  listRewards,
  upsertReward,
  type RewardRow,
} from "./twitch-store";
import { getValidAccessToken } from "./twitch-api";

const HELIX_REWARDS = "https://api.twitch.tv/helix/channel_points/custom_rewards";

interface HelixCustomReward {
  id: string;
  broadcaster_id: string;
  title: string;
  prompt: string;
  cost: number;
  is_enabled: boolean;
}

interface HelixError {
  error?: string;
  status?: number;
  message?: string;
}

export type RewardProvisionStatus =
  | { ok: true; rewards: RewardRow[] }
  | { ok: false; reason: "not_affiliate" | "no_token" | "api_error"; detail?: string };

async function helixRequest(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  url: string,
  accessToken: string,
  body?: object,
): Promise<{ status: number; body: unknown }> {
  const init: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Client-Id": env.TWITCH_CLIENT_ID,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
  };
  if (body) init.body = JSON.stringify(body);
  const res = await fetch(url, init);
  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try { parsed = JSON.parse(text); } catch { parsed = text; }
  }
  return { status: res.status, body: parsed };
}

async function listManageableRewards(
  broadcasterId: string,
  accessToken: string,
): Promise<HelixCustomReward[]> {
  const url = `${HELIX_REWARDS}?broadcaster_id=${broadcasterId}&only_manageable_rewards=true`;
  const { status, body } = await helixRequest("GET", url, accessToken);
  if (status !== 200) {
    throw new Error(`list rewards ${status}: ${JSON.stringify(body)}`);
  }
  const data = (body as { data?: HelixCustomReward[] })?.data ?? [];
  return data;
}

async function createReward(
  broadcasterId: string,
  effect: EffectDefinition,
  accessToken: string,
): Promise<HelixCustomReward> {
  const url = `${HELIX_REWARDS}?broadcaster_id=${broadcasterId}`;
  const { status, body } = await helixRequest("POST", url, accessToken, {
    title: effect.title,
    cost: effect.channelPointCost,
    prompt: effect.prompt,
    is_enabled: true,
    is_user_input_required: false,
    background_color: "#9146FF",
  });
  if (status !== 200) {
    const err = body as HelixError;
    throw new Error(`create reward (${effect.key}) ${status}: ${err?.message ?? JSON.stringify(body)}`);
  }
  const data = (body as { data: HelixCustomReward[] }).data?.[0];
  if (!data) throw new Error(`create reward (${effect.key}): empty response`);
  return data;
}

async function deleteReward(
  broadcasterId: string,
  rewardId: string,
  accessToken: string,
): Promise<void> {
  const url = `${HELIX_REWARDS}?broadcaster_id=${broadcasterId}&id=${rewardId}`;
  const { status, body } = await helixRequest("DELETE", url, accessToken);
  if (status !== 204 && status !== 404) {
    throw new Error(`delete reward ${status}: ${JSON.stringify(body)}`);
  }
}

/**
 * Mark a redemption fulfilled or canceled (refunds the channel points).
 * Status MUST be FULFILLED or CANCELED — UNFULFILLED keeps the redemption in
 * the broadcaster's queue for manual review.
 */
export async function updateRedemptionStatus(args: {
  broadcasterId: string;
  rewardId: string;
  redemptionId: string;
  status: "FULFILLED" | "CANCELED";
  steamId: string;
}): Promise<boolean> {
  const token = await getValidAccessToken(args.steamId);
  if (!token) return false;
  const url = `https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions?id=${args.redemptionId}&broadcaster_id=${args.broadcasterId}&reward_id=${args.rewardId}`;
  const { status } = await helixRequest("PATCH", url, token, { status: args.status });
  return status === 200;
}

/**
 * Make sure every CHANNEL_POINT_EFFECTS effect has a live reward on the
 * broadcaster's channel and its ID is recorded in our DB. Idempotent — runs
 * cheaply when everything is already in sync.
 *
 * Strategy:
 *   1. Fetch our manageable rewards via Helix.
 *   2. For each effect in our catalog, find a matching reward by title.
 *      If found, upsert the DB row with the live ID + current cost.
 *      If missing, create it via Helix and upsert.
 *   3. Stale rows (effect not in catalog any more) are not touched here —
 *      handled by `tearDownRewards` when the streamer disconnects.
 */
export async function ensureRewards(
  broadcasterId: string,
  steamId: string,
): Promise<RewardProvisionStatus> {
  const token = await getValidAccessToken(steamId);
  if (!token) return { ok: false, reason: "no_token" };

  let existing: HelixCustomReward[];
  try {
    existing = await listManageableRewards(broadcasterId, token);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("403") && /affiliate|partner/i.test(msg)) {
      return { ok: false, reason: "not_affiliate", detail: msg };
    }
    return { ok: false, reason: "api_error", detail: msg };
  }

  const byTitle = new Map(existing.map((r) => [r.title, r]));

  for (const effect of CHANNEL_POINT_EFFECTS) {
    if (effect.channelPointCost === null) continue;
    let reward = byTitle.get(effect.title);
    if (!reward) {
      try {
        reward = await createReward(broadcasterId, effect, token);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("403") && /affiliate|partner/i.test(msg)) {
          return { ok: false, reason: "not_affiliate", detail: msg };
        }
        return { ok: false, reason: "api_error", detail: msg };
      }
    }
    upsertReward({
      broadcasterId,
      effectKey: effect.key,
      rewardId: reward.id,
      cost: reward.cost,
      enabled: reward.is_enabled,
    });
  }

  return { ok: true, rewards: listRewards(broadcasterId) };
}

/**
 * Remove every reward we created for this broadcaster, both on Twitch and in
 * our DB. Best-effort on the Helix side — if a delete fails we still wipe the
 * DB rows so we don't keep stale IDs around.
 */
export async function tearDownRewards(
  broadcasterId: string,
  steamId: string,
): Promise<void> {
  const rows = listRewards(broadcasterId);
  if (rows.length === 0) return;
  const token = await getValidAccessToken(steamId);
  if (token) {
    await Promise.all(
      rows.map((r) =>
        deleteReward(broadcasterId, r.rewardId, token).catch((err) => {
          console.warn(`[twitch] delete reward ${r.rewardId} failed:`, err);
        }),
      ),
    );
  }
  deleteRewardsForBroadcaster(broadcasterId);
}

export function effectForRewardTitle(title: string): EffectKey | null {
  for (const k of Object.keys(EFFECTS) as EffectKey[]) {
    if (EFFECTS[k].title === title) return k;
  }
  return null;
}
