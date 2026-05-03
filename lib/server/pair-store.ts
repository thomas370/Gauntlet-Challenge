// In-memory pairing-code store. Codes expire after 5 minutes.
//
// Flow:
//   1. Host calls createCode() → server returns a 6-char code
//   2. Player visits /pair, enters code, completes Steam OAuth
//   3. Auth callback calls claimCode(code, user) → marks the entry as claimed
//   4. Host polls peekCode(code) until `claimed` is set → consumeCode() → applies to slot

import type { SteamSessionUser } from "@/lib/types/steam";

interface Entry {
  createdAt: number;
  claimed?: SteamSessionUser;
}

const codes = new Map<string, Entry>();
const TTL_MS = 5 * 60 * 1000;

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L

function generate(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

function gc(now: number) {
  codes.forEach((v, k) => {
    if (now - v.createdAt > TTL_MS) codes.delete(k);
  });
}

export function createCode(): { code: string; expiresInSec: number } {
  const now = Date.now();
  gc(now);
  let code: string;
  do {
    code = generate();
  } while (codes.has(code));
  codes.set(code, { createdAt: now });
  return { code, expiresInSec: TTL_MS / 1000 };
}

/** Mark a code as claimed by the given Steam user. Returns false if expired/missing. */
export function claimCode(code: string, user: SteamSessionUser): boolean {
  const key = code.toUpperCase();
  const entry = codes.get(key);
  if (!entry) return false;
  if (Date.now() - entry.createdAt > TTL_MS) {
    codes.delete(key);
    return false;
  }
  entry.claimed = user;
  return true;
}

/** Read-only check used by host polling. */
export function peekCode(
  code: string,
): { exists: true; claimed?: SteamSessionUser; expired: boolean } | { exists: false } {
  const entry = codes.get(code);
  if (!entry) return { exists: false };
  const expired = Date.now() - entry.createdAt > TTL_MS;
  return { exists: true, claimed: entry.claimed, expired };
}

/** Consume the code (host has applied it). Returns the claimed user or null. */
export function consumeCode(code: string): SteamSessionUser | null {
  const entry = codes.get(code);
  codes.delete(code);
  return entry?.claimed ?? null;
}
