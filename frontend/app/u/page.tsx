"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { POOL } from "@/lib/games";
import type { ProfilePayload } from "@/lib/types/stats";

const STEAM_ID_RE = /^\d{17}$/;

function ProfileShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-shell">
      <div className="auth-card profile-card">{children}</div>
    </main>
  );
}

function gameName(gameId: number): string {
  return POOL.find((g) => g.id === gameId)?.name ?? `Jeu #${gameId}`;
}

function fmtDuration(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m < 60) return sec === 0 ? `${m}min` : `${m}min ${sec}s`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm === 0 ? `${h}h` : `${h}h ${mm}min`;
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ProfileBody() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const [data, setData] = useState<ProfilePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!STEAM_ID_RE.test(id)) {
      setError("ID Steam invalide");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    (async () => {
      try {
        const res = await fetch(`/api/stats/profile?steamId=${id}`, { cache: "no-store" });
        if (cancelled) return;
        if (res.status === 404) {
          setError("Aucune run enregistrée pour ce joueur.");
          return;
        }
        if (!res.ok) throw new Error(`http_${res.status}`);
        setData((await res.json()) as ProfilePayload);
      } catch (e) {
        if (cancelled) return;
        setError(`Erreur réseau : ${(e as Error).message}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <ProfileShell>
        <p className="auth-subtitle">Chargement…</p>
      </ProfileShell>
    );
  }

  if (error) {
    return (
      <ProfileShell>
        <h1 className="auth-title">Profil</h1>
        <p className="auth-error">{error}</p>
        <Link className="auth-btn auth-btn-secondary" href="/lobby/">Retour au salon</Link>
      </ProfileShell>
    );
  }

  if (!data) return null;

  const { player, stats, recentRuns } = data;
  const winRatePct =
    stats.winRate === null ? "—" : `${Math.round(stats.winRate * 100)}%`;

  return (
    <ProfileShell>
      <header className="profile-header">
        <img src={player.avatarUrl} alt="" className="profile-avatar" />
        <div>
          <h1 className="profile-name">{player.displayName}</h1>
          <a
            className="profile-steam-link"
            href={player.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Profil Steam ↗
          </a>
        </div>
      </header>

      <section className="profile-stats">
        <StatTile label="Runs jouées" value={String(stats.totalRuns)} />
        <StatTile
          label="Win rate"
          value={winRatePct}
          sub={`${stats.wins} W / ${stats.losses} L`}
        />
        <StatTile
          label="Meilleur temps"
          value={
            stats.fastestWinSeconds === null
              ? "—"
              : fmtDuration(stats.fastestWinSeconds)
          }
          sub={
            stats.fastestHardcoreWinSeconds === null
              ? "Aucune win en hardcore"
              : `Hardcore : ${fmtDuration(stats.fastestHardcoreWinSeconds)}`
          }
        />
        <StatTile
          label="Bête noire"
          value={
            stats.mostFearedGame === null
              ? "—"
              : gameName(stats.mostFearedGame.gameId)
          }
          sub={
            stats.mostFearedGame === null
              ? "Aucun échec enregistré"
              : `${stats.mostFearedGame.failCount} échec${stats.mostFearedGame.failCount > 1 ? "s" : ""}`
          }
        />
      </section>

      <section className="profile-runs">
        <h2 className="profile-section-title">Dernières runs</h2>
        {recentRuns.length === 0 ? (
          <p className="auth-subtitle">Aucune run enregistrée.</p>
        ) : (
          <ul className="profile-run-list">
            {recentRuns.map((r) => (
              <li
                key={r.id}
                className={`profile-run profile-run-${r.outcome}`}
              >
                <div className="profile-run-main">
                  <span className={`profile-run-badge profile-run-badge-${r.outcome}`}>
                    {r.outcome === "win" ? "WIN" : "LOSE"}
                  </span>
                  <span className="profile-run-mode">
                    {r.difficulty === "hardcore" ? "Hardcore" : "Normal"}
                    {" · "}
                    {r.penaltyMode === "reset" ? "Reset" : "Stepback"}
                  </span>
                  <span className="profile-run-progress">
                    {r.completed}/{r.total}
                  </span>
                  <span className="profile-run-duration">
                    {fmtDuration(r.durationSeconds)}
                  </span>
                  <span className="profile-run-date">{fmtDate(r.endedAt)}</span>
                </div>
                {r.outcome === "lose" && r.failedGameId !== null && (
                  <div className="profile-run-failed">
                    Échec sur <strong>{gameName(r.failedGameId)}</strong>
                  </div>
                )}
                {r.players.length > 1 && (
                  <div className="profile-run-players">
                    {r.players
                      .filter((p) => p.steamId !== player.steamId)
                      .map((p) => (
                        <Link
                          key={p.steamId}
                          href={`/u?id=${p.steamId}`}
                          className="profile-run-player"
                          title={p.displayName}
                        >
                          <img src={p.avatarUrl} alt="" />
                          <span>{p.displayName}</span>
                        </Link>
                      ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link className="auth-btn auth-btn-secondary" href="/lobby/">Retour au salon</Link>
    </ProfileShell>
  );
}

function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="profile-stat-tile">
      <div className="profile-stat-label">{label}</div>
      <div className="profile-stat-value">{value}</div>
      {sub && <div className="profile-stat-sub">{sub}</div>}
    </div>
  );
}

export default function ProfilePage() {
  return (
    // useSearchParams requires a Suspense boundary in static export builds.
    <Suspense fallback={<ProfileShell><p className="auth-subtitle">Chargement…</p></ProfileShell>}>
      <ProfileBody />
    </Suspense>
  );
}
