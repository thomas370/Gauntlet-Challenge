"use client";

import { useEffect, useState } from "react";
import type { SteamSessionUser } from "@/lib/types/steam";

export function useMe(): SteamSessionUser | null {
  const [me, setMe] = useState<SteamSessionUser | null>(null);
  useEffect(() => {
    fetch("/api/me")
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        // Guard: vérifie que c'est bien un user et pas un objet d'erreur
        if (data && typeof data === "object" && "steamId" in data) {
          setMe(data as SteamSessionUser);
        }
      })
      .catch(() => {});
  }, []);
  return me;
}
