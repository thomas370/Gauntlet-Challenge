"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  LeaderboardPlayer,
  LeaderboardRun,
  LeaderboardsPayload,
} from "@/lib/types/stats";
import type { Difficulty } from "@/lib/types";

function fmtDuration(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m < 60) return sec === 0 ? `${m}min` : `${m}min ${sec}s`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm === 0 ? `${h}h` : `${h}h ${mm}min`;
}

type FastestKey = "all" | Difficulty;

const FASTEST_TABS: { key: FastestKey; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "normal", label: "Normal" },
  { key: "hardcore", label: "Hardcore" },
];

export default function LeaderboardsPage() {
  const [data, setData] = useState<LeaderboardsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fastestTab, setFastestTab] = useState<FastestKey>("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stats/leaderboards", { cache: "no-store" });
        if (cancelled) return;
        if (!res.ok) throw new Error(`http_${res.status}`);
        setData((await res.json()) as LeaderboardsPayload);
      } catch (e) {
        if (cancelled) return;
        setError(`Erreur réseau : ${(e as Error).message}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="auth-shell">
      <div className="auth-card profile-card">
        <h1 className="profile-name" style={{ marginBottom: 0 }}>Classements</h1>

        {loading && <p className="auth-subtitle">Chargement…</p>}
        {error && <p className="auth-error">{error}</p>}

        {data && (
          <>
            <section>
              <div className="leaderboard-section-header">
                <h2 className="profile-section-title">Runs les plus rapides</h2>
                <div className="leaderboard-tabs">
                  {FASTEST_TABS.map((t) => (
                    <button
                      key={t.key}
                      className={`leaderboard-tab ${fastestTab === t.key ? "is-active" : ""}`}
                      onClick={() => setFastestTab(t.key)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <FastestList runs={data.fastestWins[fastestTab]} />
            </section>

            <PlayerLeaderboard
              title="Plus de victoires"
              entries={data.mostWins}
              suffix={(n) => `${n} W`}
            />
            <PlayerLeaderboard
              title="Plus longue série de wins"
              entries={data.longestStreak}
              suffix={(n) => `${n} d'affilée`}
            />
            <PlayerLeaderboard
              title="Plus de runs jouées"
              entries={data.mostRuns}
              suffix={(n) => `${n} runs`}
            />
          </>
        )}

        <Link className="auth-btn auth-btn-secondary" href="/lobby/">Retour au salon</Link>
      </div>
    </main>
  );
}

function FastestList({ runs }: { runs: LeaderboardRun[] }) {
  if (runs.length === 0) {
    return <p className="auth-subtitle">Aucune run gagnée.</p>;
  }
  return (
    <ol className="leaderboard-list">
      {runs.map((r, i) => (
        <li key={r.id} className="leaderboard-row">
          <span className="leaderboard-rank">#{i + 1}</span>
          <span className="leaderboard-time">{fmtDuration(r.durationSeconds)}</span>
          <span
            className={`hero-meta-pill ${r.difficulty}`}
            style={{ fontSize: 11, padding: "2px 8px" }}
          >
            {r.difficulty === "hardcore" ? "Hardcore" : "Normal"}
          </span>
          <div className="leaderboard-players">
            {r.players.map((p) => (
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
        </li>
      ))}
    </ol>
  );
}

function PlayerLeaderboard({
  title,
  entries,
  suffix,
}: {
  title: string;
  entries: LeaderboardPlayer[];
  suffix: (n: number) => string;
}) {
  return (
    <section>
      <h2 className="profile-section-title">{title}</h2>
      {entries.length === 0 ? (
        <p className="auth-subtitle">Pas encore de données.</p>
      ) : (
        <ol className="leaderboard-list">
          {entries.map((p, i) => (
            <li key={p.steamId} className="leaderboard-row">
              <span className="leaderboard-rank">#{i + 1}</span>
              <Link href={`/u?id=${p.steamId}`} className="leaderboard-player">
                <img src={p.avatarUrl} alt="" />
                <span>{p.displayName}</span>
              </Link>
              <span className="leaderboard-value">{suffix(p.value)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
