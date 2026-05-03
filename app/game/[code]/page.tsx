"use client";

// Cette page est un vestige de l'ancienne architecture (avant Socket.io).
// Elle redirige automatiquement vers /room/[code] qui est la vraie page de jeu.

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function GameRedirect() {
  const params = useParams<{ code: string }>();
  const router = useRouter();

  useEffect(() => {
    const code = (params.code ?? "").toUpperCase();
    router.replace(code ? `/room/${code}` : "/lobby");
  }, [params.code, router]);

  return null;
}
