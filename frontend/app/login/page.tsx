"use client";

import { useEffect, useState } from "react";

type Status = "ok" | "cancelled" | "invalid" | null;

export default function LoginPage() {
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    const params = new URL(window.location.href).searchParams;
    const s = params.get("login") as Status;
    if (s === "ok" || s === "cancelled" || s === "invalid") setStatus(s);
  }, []);

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">Gauntlet Challenge</h1>
        <p className="auth-subtitle">Connecte-toi avec Steam pour continuer.</p>
        {status === "cancelled" && (
          <p className="auth-error">Connexion annulée.</p>
        )}
        {status === "invalid" && (
          <p className="auth-error">Connexion invalide. Réessaie.</p>
        )}
        <a className="auth-btn" href="/api/auth/steam">
          Se connecter avec Steam
        </a>
      </div>
    </main>
  );
}
