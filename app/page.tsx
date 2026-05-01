"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { POOL, getCategories, effectiveMode } from "@/lib/games";
import { DEFAULT_STATE, type GauntletState, type Difficulty, type PenaltyMode } from "@/lib/types";
import { loadPB, recordRun, formatTime } from "@/lib/timer";

import { TopBar } from "@/components/sections/TopBar";
import { Hero } from "@/components/sections/Hero";
import { ConfigPanel } from "@/components/sections/ConfigPanel";
import { PoolPanel } from "@/components/sections/PoolPanel";
import { RunPanel } from "@/components/sections/RunPanel";
import { RulesBlock } from "@/components/sections/RulesBlock";
import { DownloadWarning } from "@/components/sections/DownloadWarning";
import { WinOverlay } from "@/components/sections/WinOverlay";
import { LoseOverlay } from "@/components/sections/LoseOverlay";
import { Cinematic } from "@/components/fx/Cinematic";
import { Konami } from "@/components/fx/Konami";
import { IconTrash } from "@/lib/icons-svg";

const STORAGE_KEY = "gauntlet_v2";
const TIMER_KEY = "gauntlet_timer_v1";

interface TimerState {
  startTs: number | null;
  lastTotalMs: number;
}

const DEFAULT_TIMER: TimerState = { startTs: null, lastTotalMs: 0 };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Page() {
  const [state, setState] = useState<GauntletState>(DEFAULT_STATE);
  const [timer, setTimer] = useState<TimerState>(DEFAULT_TIMER);
  const [hydrated, setHydrated] = useState(false);

  const [pendingRun, setPendingRun] = useState<number[] | null>(null);
  const [overlay, setOverlay] = useState<
    | { kind: null }
    | { kind: "win"; totalMs: number; isPB: boolean; previousBestMs?: number }
    | { kind: "lose"; msg: string }
  >({ kind: null });
  const [drawingFor, setDrawingFor] = useState<number | null>(null);
  const [drawingDisplay, setDrawingDisplay] = useState<string>("");
  const [swappedIdx, setSwappedIdx] = useState<number | null>(null);
  const [flashLossIdx, setFlashLossIdx] = useState<number | null>(null);
  const [cinematic, setCinematic] = useState<{ idx: number; name: string } | null>(null);
  const [pbMs, setPbMs] = useState<number | null>(null);

  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setState({ ...DEFAULT_STATE, ...JSON.parse(raw) });
      const tRaw = typeof window !== "undefined" ? localStorage.getItem(TIMER_KEY) : null;
      if (tRaw) setTimer({ ...DEFAULT_TIMER, ...JSON.parse(tRaw) });
      const pb = loadPB();
      const next = pb.best?.totalMs ?? null;
      setPbMs(next);
    } catch (e) { console.warn(e); }
    setHydrated(true);
  }, []);

  // Persist state
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(TIMER_KEY, JSON.stringify(timer)); } catch {}
  }, [timer, hydrated]);

  // Refresh PB when difficulty changes
  useEffect(() => {
    if (!hydrated) return;
    const pb = loadPB();
    setPbMs(state.difficulty === "hardcore" ? pb.bestHardcore?.totalMs ?? null : pb.best?.totalMs ?? null);
  }, [state.difficulty, hydrated]);

  // === HELPERS ===
  const update = (patch: Partial<GauntletState>) => setState((s) => ({ ...s, ...patch }));

  const togglePin = (id: number) => {
    setState((s) => {
      if (s.pinned.includes(id)) return { ...s, pinned: s.pinned.filter((x) => x !== id) };
      if (s.pinned.length >= 5) {
        alert("Maximum 5 jeux épinglés. Retire-en un avant d'en ajouter un autre.");
        return s;
      }
      return { ...s, pinned: [...s.pinned, id] };
    });
  };

  const buildRun = (currentState: GauntletState): number[] => {
    const pinned = [...currentState.pinned];
    const others = POOL.filter((g) => !pinned.includes(g.id));
    const remaining = 10 - pinned.length;
    if (remaining > others.length) {
      alert("Pas assez de jeux dans le pool !");
      return [];
    }
    const random = shuffle(others).slice(0, remaining).map((g) => g.id);
    return shuffle([...pinned, ...random]);
  };

  // Generate -> stage as pendingRun -> show DownloadWarning
  const requestGenerate = () => {
    const run = buildRun(state);
    if (run.length === 0) return;
    if (state.run.length > 0 && state.done.length > 0) {
      if (!confirm("Une run est en cours. Générer une nouvelle run effacera la progression. Continuer ?")) return;
    }
    setPendingRun(run);
  };

  const confirmStartRun = () => {
    if (!pendingRun) return;
    const startTs = Date.now();
    setState((s) => ({
      ...s,
      run: pendingRun,
      current: 0,
      done: [],
      champions: {},
      attempt: 1,
    }));
    setTimer({ startTs, lastTotalMs: 0 });
    setPendingRun(null);
    setTimeout(() => {
      document.getElementById("runPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const cancelStartRun = () => setPendingRun(null);

  const rerollRun = () => {
    if (state.run.length === 0) return;
    if (state.done.length > 0 && !confirm("Une run est en cours. Re-roll va tout remettre à zéro. Continuer ?")) return;
    requestGenerate();
  };

  const swapGame = (gameId: number) => {
    if (state.done.includes(gameId)) {
      alert("Ce jeu est déjà validé, impossible de le swap.");
      return;
    }
    setState((s) => {
      const idx = s.run.indexOf(gameId);
      if (idx === -1) return s;
      const available = POOL.filter((g) => !s.run.includes(g.id));
      if (available.length === 0) {
        alert("Plus aucun jeu disponible dans le pool pour swap.");
        return s;
      }
      const newGame = available[Math.floor(Math.random() * available.length)];
      const newRun = [...s.run];
      newRun[idx] = newGame.id;
      const newPinned = s.pinned.filter((x) => x !== gameId);
      const newChampions = { ...s.champions };
      delete newChampions[gameId];
      setSwappedIdx(idx);
      if (swapTimer.current) clearTimeout(swapTimer.current);
      swapTimer.current = setTimeout(() => setSwappedIdx(null), 700);
      return { ...s, run: newRun, pinned: newPinned, champions: newChampions };
    });
  };

  const drawChampion = (gameId: number, mode: "solo" | "duo") => {
    const players = state.players.slice(0, state.playerCount).filter((p) => p && p.trim());
    if (players.length === 0) {
      alert("Saisis au moins le pseudo de tes joueurs en haut de la page !");
      return;
    }
    if (mode === "duo" && players.length < 2) {
      alert("Il faut au moins 2 joueurs pour un duo.");
      return;
    }
    setDrawingFor(gameId);
    let spins = 0;
    const totalSpins = 22;
    const interval = setInterval(() => {
      let pick: string;
      if (mode === "duo" && players.length >= 2) {
        const sh = shuffle(players);
        pick = `${sh[0]} & ${sh[1]}`;
      } else {
        pick = players[Math.floor(Math.random() * players.length)];
      }
      setDrawingDisplay(pick);
      spins++;
      if (spins >= totalSpins) {
        clearInterval(interval);
        let final: string;
        if (mode === "duo" && players.length >= 2) {
          const sh = shuffle(players);
          final = `${sh[0]} & ${sh[1]}`;
        } else {
          final = players[Math.floor(Math.random() * players.length)];
        }
        setState((s) => ({ ...s, champions: { ...s.champions, [gameId]: final } }));
        setDrawingFor(null);
        setDrawingDisplay("");
      }
    }, 60);
  };

  const winGame = (gameId: number) => {
    setState((s) => {
      if (s.done.includes(gameId)) return s;
      const newDone = [...s.done, gameId];
      const newCurrent = s.current + 1;
      const isLast = newDone.length === s.run.length;

      if (isLast) {
        const totalMs = timer.startTs ? Date.now() - timer.startTs : 0;
        setTimeout(() => {
          const { newPB, previousBest } = recordRun({
            totalMs,
            perGame: {},
            difficulty: s.difficulty,
            attempt: s.attempt,
            date: new Date().toISOString(),
          });
          setOverlay({ kind: "win", totalMs, isPB: newPB, previousBestMs: previousBest?.totalMs });
          setTimer({ startTs: null, lastTotalMs: totalMs });
          const pb = loadPB();
          setPbMs(s.difficulty === "hardcore" ? pb.bestHardcore?.totalMs ?? null : pb.best?.totalMs ?? null);
        }, 400);
      } else {
        const nextGameId = s.run[newCurrent];
        const nextG = POOL.find((g) => g.id === nextGameId);
        if (nextG) {
          setTimeout(() => setCinematic({ idx: newCurrent, name: nextG.name }), 200);
        }
      }

      return { ...s, done: newDone, current: newCurrent };
    });
  };

  const loseGame = (gameId: number) => {
    setState((s) => {
      const g = POOL.find((x) => x.id === gameId);
      const idx = s.run.indexOf(gameId);
      let msg = "";
      let next: GauntletState;

      // Flash chain at lost index
      setFlashLossIdx(idx);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlashLossIdx(null), 700);

      if (s.penaltyMode === "stepback") {
        if (idx <= 0) {
          msg = `Défaite sur ${g?.name ?? "ce jeu"}. Tu es au jeu 1, impossible de reculer plus — réessaye.`;
          next = { ...s, attempt: s.attempt + 1 };
        } else {
          const prevGameId = s.run[idx - 1];
          const prevG = POOL.find((x) => x.id === prevGameId);
          msg = `Défaite sur ${g?.name ?? "ce jeu"}. Retour sur ${prevG?.name ?? "le jeu précédent"} (jeu #${idx}).`;
          next = { ...s, attempt: s.attempt + 1, current: idx - 1, done: s.done.filter((x) => x !== prevGameId) };
        }
      } else {
        msg = `Défaite sur ${g?.name ?? "ce jeu"}. Tentative #${s.attempt + 1} — la run recommence depuis le jeu 1.`;
        next = { ...s, attempt: s.attempt + 1, current: 0, done: [], champions: {} };
        // Reset timer on full reset penalty
        setTimer({ startTs: Date.now(), lastTotalMs: 0 });
      }

      setOverlay({ kind: "lose", msg });
      return next;
    });
  };

  const fullReset = () => {
    setState((s) => ({ ...s, attempt: 1, current: 0, done: [], champions: {}, run: [] }));
    setTimer(DEFAULT_TIMER);
  };

  const hardReset = () => {
    if (!confirm("Reset complet ? Toute la progression et les épinglages seront effacés.")) return;
    setState((s) => ({ ...DEFAULT_STATE, difficulty: s.difficulty, penaltyMode: s.penaltyMode, players: s.players, playerCount: s.playerCount }));
    setTimer(DEFAULT_TIMER);
  };

  // === DERIVED ===
  const filteredPool = useMemo(
    () => POOL.filter(
      (g) =>
        (state.filter === "all" || g.cat === state.filter) &&
        (!state.search || g.name.toLowerCase().includes(state.search.toLowerCase()))
    ),
    [state.filter, state.search]
  );

  const pendingRunGames = useMemo(
    () => pendingRun ? pendingRun.map((id) => POOL.find((g) => g.id === id)).filter(Boolean) as any[] : [],
    [pendingRun]
  );

  if (!hydrated) {
    return (
      <main className="shell">
        <Hero attempt={1} difficulty="normal" inRun={false} />
        <div className="empty-run"><h3>Chargement…</h3></div>
      </main>
    );
  }

  return (
    <>
      <Konami />
      <main className="shell">
        <TopBar
          run={state.run}
          done={state.done}
          current={state.current}
          flashLossIdx={flashLossIdx}
          startTs={timer.startTs}
          pbMs={pbMs}
        />

        <Hero
          attempt={state.attempt}
          difficulty={state.difficulty}
          inRun={state.run.length > 0}
        />

        <ConfigPanel
          players={state.players}
          playerCount={state.playerCount}
          difficulty={state.difficulty}
          penaltyMode={state.penaltyMode}
          onPlayersChange={(players) => update({ players })}
          onPlayerCountChange={(playerCount) => update({ playerCount })}
          onDifficultyChange={(difficulty) => update({ difficulty })}
          onPenaltyChange={(penaltyMode) => update({ penaltyMode })}
        />

        <PoolPanel
          pool={POOL}
          filteredPool={filteredPool}
          categories={getCategories()}
          difficulty={state.difficulty}
          pinned={state.pinned}
          filter={state.filter}
          search={state.search}
          onFilterChange={(filter) => update({ filter })}
          onSearchChange={(search) => update({ search })}
          onTogglePin={togglePin}
          onGenerate={requestGenerate}
          onReroll={rerollRun}
          hasRun={state.run.length > 0}
        />

        <RunPanel
          run={state.run}
          pool={POOL}
          done={state.done}
          current={state.current}
          pinned={state.pinned}
          difficulty={state.difficulty}
          champions={state.champions}
          drawingFor={drawingFor}
          drawingDisplay={drawingDisplay}
          swappedIdx={swappedIdx}
          onSwap={swapGame}
          onDraw={drawChampion}
          onWin={winGame}
          onLose={loseGame}
        />

        <div className="btn-row" style={{ justifyContent: "flex-end", marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={hardReset}>
            <IconTrash size={14} /> Reset complet
          </button>
        </div>

        <RulesBlock />
      </main>

      {pendingRun && (
        <DownloadWarning
          games={pendingRunGames}
          onConfirm={confirmStartRun}
          onCancel={cancelStartRun}
        />
      )}

      {cinematic && (
        <Cinematic
          nextIdx={cinematic.idx}
          nextGameName={cinematic.name}
          onDone={() => setCinematic(null)}
        />
      )}

      {overlay.kind === "win" && (
        <WinOverlay
          totalMs={overlay.totalMs}
          attempt={state.attempt}
          difficulty={state.difficulty}
          players={state.players.slice(0, state.playerCount).filter(Boolean)}
          isPB={overlay.isPB}
          previousBestMs={overlay.previousBestMs}
          onRestart={() => {
            setOverlay({ kind: null });
            fullReset();
          }}
        />
      )}

      {overlay.kind === "lose" && (
        <LoseOverlay
          message={overlay.msg}
          onClose={() => setOverlay({ kind: null })}
        />
      )}
    </>
  );
}
