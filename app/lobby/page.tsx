"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SteamSessionUser } from "@/lib/types/steam";
import type { RoomSnapshot } from "@/lib/types/room";

export default function LobbyPage() {
  const router = useRouter();
  const [user, setUser] = useState<SteamSessionUser | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { user: SteamSessionUser | null }) => {
        if (!d.user) {
          router.replace("/login");
          return;
        }
        setUser(d.user);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const createRoom = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/room", { method: "POST" });
      if (!res.ok) throw new Error("create_failed");
      const room = (await res.json()) as RoomSnapshot;
      router.push(`/room/${room.code}`);
    } catch {
      setError("Impossible de créer la room");
    } finally {
      setBusy(false);
    }
  };

  const joinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/room/${code}`);
      if (res.status === 404) {
        setError("Room introuvable");
        return;
      }
      if (!res.ok) throw new Error("join_failed");
      router.push(`/room/${code}`);
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  if (!user) {
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <p className="auth-subtitle">Chargement…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <div className="auth-card lobby-card">
        <div className="lobby-user">
          <img src={user.avatarUrl} alt="" className="lobby-avatar" />
          <div className="lobby-user-info">
            <div className="lobby-user-name">{user.displayName}</div>
            <button className="lobby-logout" onClick={logout}>Se déconnecter</button>
          </div>
        </div>

        <h1 className="auth-title">Salon</h1>

        <button className="auth-btn" disabled={busy} onClick={createRoom}>
          Créer une room
        </button>

        <div className="lobby-divider"><span>ou</span></div>

        <form onSubmit={joinRoom} className="lobby-join">
          <label htmlFor="join-code">Rejoindre une room</label>
          <input
            id="join-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
            placeholder="ABC123"
            spellCheck={false}
            autoComplete="off"
            className="pair-code-input"
          />
          <button className="auth-btn auth-btn-secondary" type="submit" disabled={busy || code.length !== 6}>
            Rejoindre
          </button>
        </form>

        {error && <p className="auth-error">{error}</p>}
      </div>
    </main>
  );
}
