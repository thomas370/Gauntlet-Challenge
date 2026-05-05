"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "ok" | "expired" | "invalid" | "cancelled";

export default function PairPage() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    const params = new URL(window.location.href).searchParams;
    const c = params.get("code");
    const s = params.get("status") as Status | null;
    if (c) setCode(c.toUpperCase());
    if (s === "ok" || s === "expired" || s === "invalid" || s === "cancelled") setStatus(s);
  }, []);

  const startLogin = () => {
    if (code.length !== 6) return;
    window.location.href = `/api/auth/steam?pair=${encodeURIComponent(code)}`;
  };

  return (
    <main className="pair-shell">
      <div className="pair-card">
        <h1 className="pair-title">Lier ton compte Steam</h1>

        {status === "ok" && (
          <div className="pair-result pair-ok">
            <div className="pair-result-icon">✓</div>
            <p>Compte lié avec succès.</p>
            <p className="pair-result-hint">Tu peux fermer cette page et revenir à l&apos;hôte.</p>
          </div>
        )}

        {status === "expired" && (
          <div className="pair-result pair-error">
            <div className="pair-result-icon">⚠</div>
            <p>Le code a expiré.</p>
            <p className="pair-result-hint">Demande un nouveau code à l&apos;hôte.</p>
          </div>
        )}

        {(status === "invalid" || status === "cancelled") && (
          <div className="pair-result pair-error">
            <div className="pair-result-icon">⚠</div>
            <p>Connexion {status === "cancelled" ? "annulée" : "invalide"}.</p>
            <button className="pair-btn pair-btn-secondary" onClick={() => setStatus("idle")}>
              Réessayer
            </button>
          </div>
        )}

        {status === "idle" && (
          <>
            <p className="pair-instructions">
              Entre le code de 6 caractères affiché par l&apos;hôte, puis connecte-toi avec
              Steam.
            </p>
            <input
              className="pair-code-input"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
              placeholder="ABC123"
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
            <button
              className="pair-btn pair-btn-primary"
              disabled={code.length !== 6}
              onClick={startLogin}
            >
              Se connecter avec Steam
            </button>
            <p className="pair-result-hint">Le code expire après 5 minutes.</p>
          </>
        )}
      </div>
    </main>
  );
}
