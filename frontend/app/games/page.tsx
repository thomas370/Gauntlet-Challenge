"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { POOL } from "@/lib/games";
import type { Game } from "@/lib/types";
import type { GameStats, GameStatsPayload } from "@/lib/types/stats";

const POOL_BY_ID = new Map<number, Game>(POOL.map((g) => [g.id, g]));

function coverSrc(g: Game | undefined): string | null {
  if (!g) return null;
  if (g.cover) return g.cover;
  if (g.appid) return `https://cdn.akamai.steamstatic.com/steam/apps/${g.appid}/library_600x900.jpg`;
  return null;
}

function fmtDuration(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return sec === 0 ? `${m}min` : `${m}min ${sec}s`;
}

type SortKey = "drawn" | "clearance" | "failed" | "avgTime";

interface Row extends GameStats {
  game: Game | undefined;
  attempts: number;
  clearancePct: number | null;
}

function buildRows(games: GameStats[]): Row[] {
  return games.map((g) => {
    const attempts = g.completed + g.failed;
    return {
      ...g,
      game: POOL_BY_ID.get(g.gameId),
      attempts,
      clearancePct: attempts > 0 ? g.completed / attempts : null,
    };
  });
}

function sortRows(rows: Row[], key: SortKey): Row[] {
  const copy = [...rows];
  switch (key) {
    case "drawn":
      copy.sort((a, b) => b.drawn - a.drawn || a.gameId - b.gameId);
      break;
    case "clearance":
      copy.sort((a, b) => {
        // Nulls last, low-sample tie-break by attempts.
        if (a.clearancePct === null && b.clearancePct === null) return b.attempts - a.attempts;
        if (a.clearancePct === null) return 1;
        if (b.clearancePct === null) return -1;
        return b.clearancePct - a.clearancePct || b.attempts - a.attempts;
      });
      break;
    case "failed":
      copy.sort((a, b) => b.failed - a.failed || b.attempts - a.attempts);
      break;
    case "avgTime":
      copy.sort((a, b) => {
        if (a.avgDurationSeconds === null && b.avgDurationSeconds === null) return 0;
        if (a.avgDurationSeconds === null) return 1;
        if (b.avgDurationSeconds === null) return -1;
        return a.avgDurationSeconds - b.avgDurationSeconds;
      });
      break;
  }
  return copy;
}

const SORT_TABS: { key: SortKey; label: string }[] = [
  { key: "drawn", label: "Tirages" },
  { key: "clearance", label: "Clearance %" },
  { key: "failed", label: "Échecs" },
  { key: "avgTime", label: "Temps moyen" },
];

export default function GameStatsPage() {
  const [data, setData] = useState<GameStatsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("drawn");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stats/games", { cache: "no-store" });
        if (cancelled) return;
        if (!res.ok) throw new Error(`http_${res.status}`);
        setData((await res.json()) as GameStatsPayload);
      } catch (e) {
        if (cancelled) return;
        setError(`Erreur réseau : ${(e as Error).message}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    return sortRows(buildRows(data.games), sortKey);
  }, [data, sortKey]);

  return (
    <main className="auth-shell">
      <div className="auth-card profile-card games-stats-card">
        <h1 className="profile-name" style={{ marginBottom: 0 }}>Statistiques par jeu</h1>

        {loading && <p className="auth-subtitle">Chargement…</p>}
        {error && <p className="auth-error">{error}</p>}

        {data && data.games.length === 0 && (
          <p className="auth-subtitle">Aucune donnée — joue une run pour commencer à remplir les stats.</p>
        )}

        {data && data.games.length > 0 && (
          <>
            <div className="leaderboard-section-header">
              <p className="auth-subtitle" style={{ margin: 0 }}>
                {data.totalRuns} run{data.totalRuns > 1 ? "s" : ""} enregistrée{data.totalRuns > 1 ? "s" : ""} ·
                {" "}{data.games.length} jeu{data.games.length > 1 ? "x" : ""} apparu{data.games.length > 1 ? "s" : ""}
              </p>
              <div className="leaderboard-tabs">
                {SORT_TABS.map((t) => (
                  <button
                    key={t.key}
                    className={`leaderboard-tab ${sortKey === t.key ? "is-active" : ""}`}
                    onClick={() => setSortKey(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="games-stats-table" role="table">
              <div className="games-stats-head" role="row">
                <span role="columnheader">Jeu</span>
                <span role="columnheader" className="num">Tirés</span>
                <span role="columnheader" className="num">Joués</span>
                <span role="columnheader" className="num">%</span>
                <span role="columnheader" className="num">Échecs</span>
                <span role="columnheader" className="num">Temps moy.</span>
              </div>
              {rows.map((r) => (
                <GameRow key={r.gameId} row={r} />
              ))}
            </div>
          </>
        )}

        <Link className="auth-btn auth-btn-secondary" href="/lobby/">Retour au salon</Link>
      </div>
    </main>
  );
}

function GameRow({ row }: { row: Row }) {
  const { game, drawn, completed, failed, attempts, clearancePct, avgDurationSeconds } = row;
  const cover = coverSrc(game);
  const name = game?.name ?? `Jeu #${row.gameId}`;
  // `failed` is already destructured above (the run-failure count); use a
  // distinct name for cover-load failures.
  const [coverFailedSrc, setCoverFailedSrc] = useState<string | null>(null);
  const coverFailed = cover !== null && coverFailedSrc === cover;
  return (
    <div className="games-stats-row" role="row">
      <div className="games-stats-game">
        {cover && !coverFailed ? (
          <img
            src={cover}
            alt=""
            className="games-stats-cover"
            loading="lazy"
            onError={() => setCoverFailedSrc(cover)}
          />
        ) : (
          <div className="games-stats-cover games-stats-cover-fallback">
            {name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="games-stats-name">
          <span>{name}</span>
          {game?.cat && <small>{game.cat}</small>}
        </div>
      </div>
      <span className="num">{drawn}</span>
      <span className="num">{attempts}</span>
      <span className="num games-stats-pct">
        {clearancePct === null ? "—" : `${Math.round(clearancePct * 100)}%`}
        {attempts > 0 && (
          <small> ({completed}/{attempts})</small>
        )}
      </span>
      <span className="num">{failed}</span>
      <span className="num">
        {avgDurationSeconds === null ? "—" : fmtDuration(avgDurationSeconds)}
      </span>
    </div>
  );
}
