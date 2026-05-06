// EventSub WebSocket manager — one socket per linked broadcaster.
//
// Why one socket per broadcaster: subscriptions are created with the
// broadcaster's user access token (each scope check binds to that user). A
// single socket can host subs from multiple tokens, but that adds bookkeeping
// for marginal savings — at our scale (handful of streamers), one socket
// per broadcaster keeps the lifecycle obvious.
//
// Lifecycle per broadcaster:
//   start()
//     → open WS to wss://eventsub.wss.twitch.tv/ws
//     → on session_welcome, capture session.id
//     → POST subs to Helix with transport.method=websocket, session_id
//     → on notifications, log them (Phase 3 will dispatch to effects)
//     → on session_reconnect, open the new URL, swap when the new one welcomes
//     → on close/error, exponential backoff & reconnect (subs auto-recreate)
//   stop()
//     → close socket; subscriptions die when the session ends
//
// Idempotency: every notification carries a unique Twitch-Eventsub-Message-Id
// in the payload's `metadata.message_id`. We keep an in-process LRU cache of
// recent IDs and discard duplicates (Twitch occasionally redelivers).

import WebSocket from "ws";
import { env } from "./env";
import { getValidAccessToken } from "./twitch-api";
import {
  getLinkBySteamId,
  getLinkByBroadcasterId,
  getRewardByRewardId,
  recordTwitchEvent,
} from "./twitch-store";
import { EFFECTS, type EffectKey } from "./twitch-effects";
import { applyEffect } from "./twitch-effects-engine";
import { updateRedemptionStatus } from "./twitch-rewards";

const EVENTSUB_URL = "wss://eventsub.wss.twitch.tv/ws";
const HELIX_SUBS = "https://api.twitch.tv/helix/eventsub/subscriptions";

const TOPICS: Array<{ type: string; version: string }> = [
  { type: "channel.channel_points_custom_reward_redemption.add", version: "1" },
  { type: "channel.cheer", version: "1" },
];

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 60_000;
const DUP_CACHE_SIZE = 200;

type ConnectionStatus = "disconnected" | "connecting" | "welcomed" | "subscribed" | "stopping";

interface BroadcasterConn {
  broadcasterId: string;
  steamId: string;
  socket: WebSocket | null;
  /** Active during a session_reconnect handover. */
  pendingSocket: WebSocket | null;
  sessionId: string | null;
  status: ConnectionStatus;
  reconnectAttempt: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  recentMessageIds: string[];
  lastEventAt: number | null;
  lastEventType: string | null;
  lastError: string | null;
  subscribedTypes: string[];
}

interface MetadataMessage {
  metadata: {
    message_id: string;
    message_type:
      | "session_welcome"
      | "session_keepalive"
      | "notification"
      | "session_reconnect"
      | "revocation";
    message_timestamp: string;
    subscription_type?: string;
    subscription_version?: string;
  };
  payload: {
    session?: { id: string; reconnect_url?: string; status: string };
    subscription?: { type: string };
    event?: unknown;
  };
}

const conns = new Map<string, BroadcasterConn>();

function isFresh(c: BroadcasterConn, messageId: string): boolean {
  if (c.recentMessageIds.includes(messageId)) return false;
  c.recentMessageIds.push(messageId);
  if (c.recentMessageIds.length > DUP_CACHE_SIZE) {
    c.recentMessageIds.shift();
  }
  return true;
}

async function createSubscriptions(c: BroadcasterConn, sessionId: string): Promise<void> {
  const token = await getValidAccessToken(c.steamId);
  if (!token) {
    c.lastError = "no_token";
    return;
  }
  c.subscribedTypes = [];
  for (const topic of TOPICS) {
    const res = await fetch(HELIX_SUBS, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Client-Id": env.TWITCH_CLIENT_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: topic.type,
        version: topic.version,
        condition: { broadcaster_user_id: c.broadcasterId },
        transport: { method: "websocket", session_id: sessionId },
      }),
    });
    if (res.status === 202) {
      c.subscribedTypes.push(topic.type);
    } else {
      const text = await res.text().catch(() => "");
      console.warn(
        `[twitch-eventsub] subscribe ${topic.type} for ${c.broadcasterId} failed (${res.status}): ${text}`,
      );
      c.lastError = `subscribe_${topic.type}_${res.status}`;
    }
  }
  c.status = c.subscribedTypes.length > 0 ? "subscribed" : c.status;
}

function scheduleReconnect(c: BroadcasterConn): void {
  if (c.status === "stopping") return;
  if (c.reconnectTimer) return;
  const wait = Math.min(
    RECONNECT_BASE_MS * 2 ** c.reconnectAttempt,
    RECONNECT_MAX_MS,
  );
  c.reconnectAttempt += 1;
  c.reconnectTimer = setTimeout(() => {
    c.reconnectTimer = null;
    openSocket(c, EVENTSUB_URL, /* isReconnect */ false);
  }, wait);
  console.log(
    `[twitch-eventsub] ${c.broadcasterId} reconnect in ${Math.round(wait / 1000)}s ` +
    `(attempt ${c.reconnectAttempt})`,
  );
}

function openSocket(c: BroadcasterConn, url: string, isReconnectHandover: boolean): void {
  if (c.status === "stopping") return;
  c.status = "connecting";
  const ws = new WebSocket(url);

  if (isReconnectHandover) {
    c.pendingSocket = ws;
  } else {
    c.socket = ws;
    c.sessionId = null;
  }

  ws.on("open", () => {
    // Nothing to do — we wait for session_welcome.
  });

  ws.on("message", (raw) => {
    let msg: MetadataMessage;
    try {
      msg = JSON.parse(raw.toString()) as MetadataMessage;
    } catch (err) {
      console.warn("[twitch-eventsub] bad json:", err);
      return;
    }
    if (!isFresh(c, msg.metadata.message_id)) return;

    switch (msg.metadata.message_type) {
      case "session_welcome": {
        const sid = msg.payload.session?.id;
        if (!sid) return;
        if (isReconnectHandover) {
          // Old socket can be retired now that the new one is welcomed.
          if (c.socket) c.socket.close();
          c.socket = ws;
          c.pendingSocket = null;
          c.sessionId = sid;
          c.status = "welcomed";
          // Subs migrate automatically across the reconnect handover, no need
          // to recreate them.
        } else {
          c.sessionId = sid;
          c.status = "welcomed";
          c.reconnectAttempt = 0;
          void createSubscriptions(c, sid);
        }
        console.log(`[twitch-eventsub] ${c.broadcasterId} welcomed session=${sid}`);
        break;
      }
      case "session_keepalive":
        // Heartbeat — no action.
        break;
      case "session_reconnect": {
        const reconnectUrl = msg.payload.session?.reconnect_url;
        if (!reconnectUrl) return;
        console.log(`[twitch-eventsub] ${c.broadcasterId} session_reconnect → ${reconnectUrl}`);
        openSocket(c, reconnectUrl, /* isReconnectHandover */ true);
        break;
      }
      case "notification": {
        c.lastEventAt = Date.now();
        c.lastEventType = msg.metadata.subscription_type ?? null;
        const ev = msg.payload.event as Record<string, unknown> | undefined;
        const type = msg.metadata.subscription_type;
        if (type === "channel.channel_points_custom_reward_redemption.add") {
          void handleRedemption(c, ev as RedemptionEvent | undefined);
        } else if (type === "channel.cheer") {
          void handleCheer(c, ev as CheerEvent | undefined);
        }
        break;
      }
      case "revocation": {
        const subType = msg.payload.subscription?.type;
        console.warn(`[twitch-eventsub] ${c.broadcasterId} subscription revoked: ${subType}`);
        c.subscribedTypes = c.subscribedTypes.filter((t) => t !== subType);
        c.lastError = `revoked_${subType}`;
        break;
      }
    }
  });

  ws.on("close", (code, reason) => {
    if (c.status === "stopping") return;
    if (ws !== c.socket && ws !== c.pendingSocket) return;
    if (ws === c.pendingSocket) {
      // Handover failed — drop pending, keep old socket alive.
      c.pendingSocket = null;
      console.warn(`[twitch-eventsub] ${c.broadcasterId} pending socket closed (${code})`);
      return;
    }
    console.log(
      `[twitch-eventsub] ${c.broadcasterId} closed (code=${code} reason=${reason.toString().slice(0, 60)})`,
    );
    c.socket = null;
    c.sessionId = null;
    c.status = "disconnected";
    scheduleReconnect(c);
  });

  ws.on("error", (err) => {
    c.lastError = err.message;
    console.warn(`[twitch-eventsub] ${c.broadcasterId} ws error:`, err.message);
  });
}

export function start(broadcasterId: string, steamId: string): void {
  let c = conns.get(broadcasterId);
  if (c) {
    // If we're already running, don't spin up a duplicate.
    if (c.status !== "disconnected" && c.status !== "stopping") return;
    c.status = "disconnected";
    c.steamId = steamId; // refresh in case it changed
  } else {
    c = {
      broadcasterId,
      steamId,
      socket: null,
      pendingSocket: null,
      sessionId: null,
      status: "disconnected",
      reconnectAttempt: 0,
      reconnectTimer: null,
      recentMessageIds: [],
      lastEventAt: null,
      lastEventType: null,
      lastError: null,
      subscribedTypes: [],
    };
    conns.set(broadcasterId, c);
  }
  console.log(`[twitch-eventsub] starting for broadcaster ${broadcasterId}`);
  openSocket(c, EVENTSUB_URL, /* isReconnectHandover */ false);
}

export function stop(broadcasterId: string): void {
  const c = conns.get(broadcasterId);
  if (!c) return;
  console.log(`[twitch-eventsub] stopping for broadcaster ${broadcasterId}`);
  c.status = "stopping";
  if (c.reconnectTimer) {
    clearTimeout(c.reconnectTimer);
    c.reconnectTimer = null;
  }
  if (c.socket) {
    try { c.socket.close(); } catch { /* ignore */ }
    c.socket = null;
  }
  if (c.pendingSocket) {
    try { c.pendingSocket.close(); } catch { /* ignore */ }
    c.pendingSocket = null;
  }
  conns.delete(broadcasterId);
}

export function stopAll(): void {
  for (const id of Array.from(conns.keys())) stop(id);
}

export interface EventSubStatus {
  broadcasterId: string;
  status: ConnectionStatus;
  sessionId: string | null;
  subscribedTypes: string[];
  lastEventAt: number | null;
  lastEventType: string | null;
  lastError: string | null;
}

export function getStatus(broadcasterId: string): EventSubStatus | null {
  const c = conns.get(broadcasterId);
  if (!c) return null;
  return {
    broadcasterId: c.broadcasterId,
    status: c.status,
    sessionId: c.sessionId,
    subscribedTypes: c.subscribedTypes.slice(),
    lastEventAt: c.lastEventAt,
    lastEventType: c.lastEventType,
    lastError: c.lastError,
  };
}

/** Resolve broadcaster → steamId (for tests / status queries). */
export function steamIdForBroadcaster(broadcasterId: string): string | null {
  const link = getLinkByBroadcasterId(broadcasterId);
  return link?.steamId ?? null;
}

/** Resolve steam → broadcasterId. */
export function broadcasterIdForSteam(steamId: string): string | null {
  const link = getLinkBySteamId(steamId);
  return link?.broadcasterId ?? null;
}

// === Notification dispatchers ===
//
// Channel-point redemptions are matched against `twitch_rewards` (we created
// the reward, so we know which effect_key its reward_id maps to). After we
// try to apply the effect, we update the redemption status on Twitch:
//   FULFILLED → points consumed (success)
//   CANCELED  → points refunded (effect didn't apply)
//
// Bits cheers don't have a back-channel; we parse the message for `!effect`
// keywords (with a small alias map), check the bits amount against the cost,
// and apply best-effort. There's no refund — over-funded cheers still apply,
// under-funded ones are logged and dropped.

interface RedemptionEvent {
  id: string;
  broadcaster_user_id: string;
  user_login: string;
  user_name: string;
  user_input?: string;
  reward: { id: string; title: string; cost: number };
}

interface CheerEvent {
  is_anonymous: boolean;
  user_login?: string;
  user_name?: string;
  broadcaster_user_id: string;
  message: string;
  bits: number;
}

/** Lowercase keywords accepted in cheer messages → effect_key. */
const CHEER_ALIASES: Record<string, EffectKey> = {
  reroll: "reroll",
  shield: "shield",
  skip: "skip",
  pin: "force_pin",
  force_pin: "force_pin",
  forcepin: "force_pin",
  joker: "gift_joker",
  gift_joker: "gift_joker",
  giftjoker: "gift_joker",
};

function parseCheerEffect(message: string): EffectKey | null {
  // Look for `!keyword` anywhere in the message, lowercase, first match wins.
  const m = message.toLowerCase().match(/!([a-z_]+)/);
  if (!m) return null;
  return CHEER_ALIASES[m[1]] ?? null;
}

async function handleRedemption(c: BroadcasterConn, ev: RedemptionEvent | undefined): Promise<void> {
  if (!ev) return;
  const reward = getRewardByRewardId(ev.reward.id);
  if (!reward) {
    console.log(
      `[twitch-effects] ${c.broadcasterId} redemption ignored — reward "${ev.reward.title}" (${ev.reward.id}) not in our catalog`,
    );
    recordTwitchEvent({
      broadcasterId: c.broadcasterId,
      source: "channel_points",
      effectKey: null,
      applied: false,
      failReason: "unknown_reward",
      userLogin: ev.user_login,
      bits: null,
      rewardTitle: ev.reward.title,
    });
    return;
  }
  const effectKey = reward.effectKey as EffectKey;
  const outcome = applyEffect({
    effectKey,
    source: "channel_points",
    steamId: c.steamId,
    triggeredBy: { userLogin: ev.user_login, userName: ev.user_name },
  });
  recordTwitchEvent({
    broadcasterId: c.broadcasterId,
    source: "channel_points",
    effectKey,
    applied: outcome.applied,
    failReason: outcome.applied ? null : outcome.reason,
    userLogin: ev.user_login,
    bits: null,
    rewardTitle: ev.reward.title,
  });
  // Mark the redemption FULFILLED if the effect applied, else CANCELED to
  // refund the points. Best-effort — we don't fail the dispatch on Helix errors.
  const status: "FULFILLED" | "CANCELED" = outcome.applied ? "FULFILLED" : "CANCELED";
  const ok = await updateRedemptionStatus({
    broadcasterId: c.broadcasterId,
    rewardId: ev.reward.id,
    redemptionId: ev.id,
    status,
    steamId: c.steamId,
  });
  if (!ok) {
    console.warn(
      `[twitch-effects] ${c.broadcasterId} updateRedemptionStatus(${status}) failed for ${ev.id}`,
    );
  }
}

async function handleCheer(c: BroadcasterConn, ev: CheerEvent | undefined): Promise<void> {
  if (!ev) return;
  const userLogin = ev.user_login ?? "anon";
  const effectKey = parseCheerEffect(ev.message ?? "");
  if (!effectKey) {
    console.log(
      `[twitch-effects] ${c.broadcasterId} cheer ${ev.bits} bits by ${userLogin} — no effect keyword`,
    );
    recordTwitchEvent({
      broadcasterId: c.broadcasterId,
      source: "bits",
      effectKey: null,
      applied: false,
      failReason: "no_keyword",
      userLogin,
      bits: ev.bits,
      rewardTitle: null,
    });
    return;
  }
  const def = EFFECTS[effectKey];
  if (def.bitsCost === null) {
    console.log(
      `[twitch-effects] ${c.broadcasterId} cheer keyword !${effectKey} not bits-eligible`,
    );
    recordTwitchEvent({
      broadcasterId: c.broadcasterId,
      source: "bits",
      effectKey,
      applied: false,
      failReason: "not_bits_eligible",
      userLogin,
      bits: ev.bits,
      rewardTitle: null,
    });
    return;
  }
  if (ev.bits < def.bitsCost) {
    console.log(
      `[twitch-effects] ${c.broadcasterId} cheer ${ev.bits} bits underfunded for !${effectKey} (need ${def.bitsCost})`,
    );
    recordTwitchEvent({
      broadcasterId: c.broadcasterId,
      source: "bits",
      effectKey,
      applied: false,
      failReason: `underfunded_need_${def.bitsCost}`,
      userLogin,
      bits: ev.bits,
      rewardTitle: null,
    });
    return;
  }
  const outcome = applyEffect({
    effectKey,
    source: "bits",
    steamId: c.steamId,
    triggeredBy: { userLogin, userName: ev.user_name ?? "anon" },
  });
  recordTwitchEvent({
    broadcasterId: c.broadcasterId,
    source: "bits",
    effectKey,
    applied: outcome.applied,
    failReason: outcome.applied ? null : outcome.reason,
    userLogin,
    bits: ev.bits,
    rewardTitle: null,
  });
}
