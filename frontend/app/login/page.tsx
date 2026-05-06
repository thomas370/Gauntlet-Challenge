"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Status = "ok" | "cancelled" | "invalid" | null;

export default function LoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(null);
  const [guestOpen, setGuestOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestBusy, setGuestBusy] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URL(window.location.href).searchParams;
    const s = params.get("login") as Status;
    if (s === "ok" || s === "cancelled" || s === "invalid") setStatus(s);
  }, []);

  const submitGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = guestName.trim();
    if (name.length < 2) {
      setGuestError("Choisis un pseudo de 2 caractères minimum.");
      return;
    }
    if (name.length > 24) {
      setGuestError("Pseudo trop long (24 caractères max).");
      return;
    }
    setGuestBusy(true);
    setGuestError(null);
    try {
      const res = await fetch("/api/auth/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        setGuestError("Pseudo refusé. Essaie un autre.");
        return;
      }
      router.replace("/lobby");
    } catch {
      setGuestError("Connexion au serveur impossible.");
    } finally {
      setGuestBusy(false);
    }
  };

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">Gauntlet Challenge</h1>
        <p className="auth-subtitle">Connecte-toi avec Steam, ou joue en invité.</p>
        {status === "cancelled" && (
          <p className="auth-error">Connexion annulée.</p>
        )}
        {status === "invalid" && (
          <p className="auth-error">Connexion invalide. Réessaie.</p>
        )}
        <a className="auth-btn" href="/api/auth/steam">
          Se connecter avec Steam
        </a>

        <div className="auth-divider"><span>ou</span></div>

        {!guestOpen ? (
          <button
            type="button"
            className="auth-btn auth-btn-secondary"
            onClick={() => setGuestOpen(true)}
          >
            Jouer en invité
          </button>
        ) : (
          <form onSubmit={submitGuest} className="auth-guest-form">
            <label htmlFor="guest-name" className="auth-guest-label">Pseudo</label>
            <input
              id="guest-name"
              className="pair-code-input"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Ton pseudo"
              maxLength={24}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            <button
              className="auth-btn"
              type="submit"
              disabled={guestBusy || guestName.trim().length < 2}
            >
              {guestBusy ? "Connexion…" : "Continuer en invité"}
            </button>
            <p className="auth-guest-hint">
              Sans Steam, les chips de possession et la page profil ne sont pas disponibles.
            </p>
            {guestError && <p className="auth-error">{guestError}</p>}
          </form>
        )}
      </div>
    </main>
  );
}
