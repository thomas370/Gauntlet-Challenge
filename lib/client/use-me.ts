"use client";

import { useEffect, useState } from "react";
import type { SteamSessionUser } from "@/lib/types/steam";

export function useMe(): SteamSessionUser | null {
  const [me, setMe] = useState<SteamSessionUser | null>(null);
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => setMe(data))
      .catch(() => {});
  }, []);
  return me;
}
