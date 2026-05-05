// Per-key sliding-window-ish in-memory rate limiter. 30 req/min per Steam ID.

const buckets = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const LIMIT = 30;

export function rateLimit(key: string): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= LIMIT) {
    const retryAfterMs = WINDOW_MS - (now - arr[0]);
    buckets.set(key, arr);
    return { ok: false, retryAfterMs };
  }
  arr.push(now);
  buckets.set(key, arr);
  return { ok: true, retryAfterMs: 0 };
}
