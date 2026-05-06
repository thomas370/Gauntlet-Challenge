// Catalog of viewer-triggered effects.
//
// Each effect can be triggered through either or both of two channels:
//   - "channel_points": a custom reward we provision on the broadcaster's
//     channel via Helix. Cost is in channel points, refundable on failure.
//   - "bits": a Cheer event with a marker keyword in the message
//     (`!effect <key>`). Cost is in bits, non-refundable.
//
// Some effects only make sense in one channel (skip is bits-only premium;
// force-pin & gift-joker work better as cheap channel-point rewards but we
// expose both for symmetry).
//
// `applicableWhen` is documentation for now; Phase 3 enforces it. When an
// effect arrives in an inapplicable state, channel-point redemptions are
// refunded (CANCELED via Helix) and bits are logged + dropped.

export type EffectKey =
  | "reroll"
  | "shield"
  | "skip"
  | "force_pin"
  | "gift_joker";

export type EffectApplicability =
  | "always"
  | "during_run"
  | "before_run"
  | "during_run_powerups";

export interface EffectDefinition {
  key: EffectKey;
  /** Title shown on Twitch's reward UI. Capped at 45 chars by Helix. */
  title: string;
  prompt: string;
  channelPointCost: number | null; // null = no channel-point reward
  bitsCost: number | null; // null = bits cheer can't trigger this
  applicableWhen: EffectApplicability;
}

export const EFFECTS: Record<EffectKey, EffectDefinition> = {
  reroll: {
    key: "reroll",
    title: "Gauntlet — Reroll current game",
    prompt: "Replace the team's current game with a fresh random pick.",
    channelPointCost: 500,
    bitsCost: 100,
    applicableWhen: "during_run",
  },
  shield: {
    key: "shield",
    title: "Gauntlet — Shield (retry on loss)",
    prompt: "If the team loses the current game, the defeat is negated and they retry it.",
    channelPointCost: 1000,
    bitsCost: 200,
    applicableWhen: "during_run_powerups",
  },
  skip: {
    key: "skip",
    title: "Gauntlet — Skip current game",
    prompt: "Mark the current game as cleared. Premium effect.",
    channelPointCost: null,
    bitsCost: 500,
    applicableWhen: "during_run",
  },
  force_pin: {
    key: "force_pin",
    title: "Gauntlet — Chaos pin",
    prompt: "Randomly pin a game to the next run.",
    channelPointCost: 300,
    bitsCost: 50,
    applicableWhen: "before_run",
  },
  gift_joker: {
    key: "gift_joker",
    title: "Gauntlet — Gift a joker",
    prompt: "Grant +1 joker swap to a random player in the room.",
    channelPointCost: 300,
    bitsCost: 100,
    applicableWhen: "during_run_powerups",
  },
};

export const EFFECT_KEYS = Object.keys(EFFECTS) as EffectKey[];

/** Effects that should be provisioned as a custom reward on the broadcaster's channel. */
export const CHANNEL_POINT_EFFECTS: EffectDefinition[] = EFFECT_KEYS
  .map((k) => EFFECTS[k])
  .filter((e) => e.channelPointCost !== null);
