// Thin in-memory cache wrapper. Swap to Redis later by changing this module only.

import NodeCache from "node-cache";

const store = new NodeCache({ stdTTL: 600, checkperiod: 120, useClones: false });

export const cache = {
  get<T>(key: string): T | undefined {
    return store.get<T>(key);
  },
  set<T>(key: string, value: T, ttlSeconds?: number): void {
    if (ttlSeconds === undefined) store.set(key, value);
    else store.set(key, value, ttlSeconds);
  },
  del(key: string): void {
    store.del(key);
  },
};
