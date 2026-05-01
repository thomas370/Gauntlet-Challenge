"use client";

import { useEffect, useRef, useState } from "react";
import { POOL, getCategories, effectiveMode } from "@/lib/games";
import { CAT_ICONS } from "@/lib/icons";
import {
  DEFAULT_STATE,
  type GauntletState,
  type Difficulty,
  type PenaltyMode,
  type Game,
} from "@/lib/types";

const STORAGE_KEY = "gauntlet_v2";

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
  const [hydrated, setHydrated] = useState(false);
  const [overlay, setOverlay] = useState<{ kind: "win" | "lose" | null; msg?: string }>({ kind: null });
  const [drawingFor, setDrawingFor] = useState<number | null>(null);
  const [drawingDisplay, setDrawingDisplay] = useState<string>("");
  const [swappedIdx, setSwappedIdx] = useState<number | null>(null);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        setState({ ...DEFAULT_STATE, ...parsed });
      }
    } catch (e) {
      console.warn("Load failed", e);
    }
    setHydrated(true);
  }, []);

  // Persist on every change
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Save failed", e);
    }
  }, [state, hydrated]);

  // === HELPERS ===
  const update = (patch: Partial<GauntletState>) => setState((s) => ({ ...s, ...patch }));

  const togglePin = (id: number) => {
    setState((s) => {
      if (s.pinned.includes(id)) {
        return { ...s, pinned: s.pinned.filter((x) => x !== id) };
      } else if (s.pinned.length < 5) {
        return { ...s, pinned: [...s.pinned, id] };
      } else {
        alert("Maximum 5 jeux épinglés. Retire-en un avant d'en ajouter un autre.");
        return s;
      }
    });
  };

  const generateRun = () => {
    setState((s) => {
      const pinned = [...s.pinned];
      const others = POOL.filter((g) => !pinned.includes(g.id));
      const remainingNeeded = 10 - pinned.length;
      if (remainingNeeded > others.length) {
        alert("Pas assez de jeux dans le pool !");
        return s;
      }
      const random = shuffle(others).slice(0, remainingNeeded).map((g) => g.id);
      const run = shuffle([...pinned, ...random]);
      return { ...s, run, current: 0, done: [], champions: {}, attempt: 1 };
    });
    setTimeout(() => {
      document.getElementById("runPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const rerollRun = () => {
    if (state.run.length === 0) return;
    if (state.done.length > 0 && !confirm("Une run est en cours. Re-roll va tout remettre à zéro. Continuer ?")) return;
    generateRun();
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
      // Trigger flash animation
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
      const next = { ...s, done: newDone, current: newCurrent };
      if (newDone.length === s.run.length) {
        setTimeout(() => setOverlay({ kind: "win" }), 400);
      }
      return next;
    });
  };

  const loseGame = (gameId: number) => {
    setState((s) => {
      const g = POOL.find((x) => x.id === gameId);
      const idx = s.run.indexOf(gameId);
      let msg = "";
      let next: GauntletState;

      if (s.penaltyMode === "stepback") {
        if (idx <= 0) {
          msg = `Défaite sur ${g?.name ?? "ce jeu"}. Tu es au jeu 1, impossible de reculer plus — réessaye !`;
          next = { ...s, attempt: s.attempt + 1 };
        } else {
          const prevGameId = s.run[idx - 1];
          const prevG = POOL.find((x) => x.id === prevGameId);
          msg = `Défaite sur ${g?.name ?? "ce jeu"}. Tu recules d'un jeu : retour sur ${
            prevG?.name ?? "le jeu précédent"
          } (jeu #${idx}).`;
          next = {
            ...s,
            attempt: s.attempt + 1,
            current: idx - 1,
            done: s.done.filter((x) => x !== prevGameId),
          };
        }
      } else {
        msg = `Défaite sur ${g?.name ?? "ce jeu"}. Tentative #${s.attempt + 1} — la run recommence depuis le jeu 1.`;
        next = { ...s, attempt: s.attempt + 1, current: 0, done: [], champions: {} };
      }

      setOverlay({ kind: "lose", msg });
      return next;
    });
  };

  const fullReset = () => {
    setState((s) => ({
      ...s,
      attempt: 1,
      current: 0,
      done: [],
      champions: {},
      run: [],
    }));
  };

  const hardReset = () => {
    if (!confirm("Reset complet ? Toute la progression et les épinglages seront effacés.")) return;
    setState((s) => ({ ...DEFAULT_STATE, difficulty: s.difficulty, penaltyMode: s.penaltyMode, players: s.players, playerCount: s.playerCount }));
  };

  // === DERIVED ===
  const filteredPool = POOL.filter(
    (g) =>
      (state.filter === "all" || g.cat === state.filter) &&
      (!state.search || g.name.toLowerCase().includes(state.search.toLowerCase()))
  );

  const progressPct = state.run.length === 0 ? 0 : (state.done.length / state.run.length) * 100;

  if (!hydrated) {
    // Avoid hydration mismatch — render skeleton until localStorage is loaded
    return (
      <div className="container">
        <div className="hero">
          <h1>GAUNTLET CHALLENGE</h1>
          <div className="subtitle">Chargement…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* HERO */}
      <div className="hero">
        <h1>GAUNTLET CHALLENGE</h1>
        <div className="subtitle">10 jeux · 0 défaite autorisée</div>
        <div className="lives">⚡ TENTATIVE #{state.attempt} ⚡</div>
      </div>

      {/* CONFIG */}
      <div className="panel">
        <h2>1. Configuration</h2>
        <div className="setup-grid">
          {[0, 1, 2].map((i) => (
            <div className="field" key={i}>
              <label>Joueur {i + 1}</label>
              <input
                type="text"
                value={state.players[i] ?? ""}
                placeholder="Pseudo"
                onChange={(e) => {
                  const next = [...state.players];
                  next[i] = e.target.value;
                  update({ players: next });
                }}
              />
            </div>
          ))}
          <div className="field">
            <label>Nombre de joueurs</label>
            <select
              value={state.playerCount}
              onChange={(e) => update({ playerCount: parseInt(e.target.value) })}
            >
              <option value={2}>2 joueurs</option>
              <option value={3}>3 joueurs</option>
            </select>
          </div>
        </div>

        <div className="field" style={{ marginTop: 18 }}>
          <label>Difficulté</label>
          <div className="toggle-group">
            <button
              className={`toggle ${state.difficulty === "normal" ? "active" : ""}`}
              onClick={() => update({ difficulty: "normal" as Difficulty })}
            >
              🎯 Normal
            </button>
            <button
              className={`toggle hardcore ${state.difficulty === "hardcore" ? "active" : ""}`}
              onClick={() => update({ difficulty: "hardcore" as Difficulty })}
            >
              🔥 Hardcore
            </button>
          </div>
        </div>

        <div className="field" style={{ marginTop: 18 }}>
          <label>Pénalité en cas de défaite</label>
          <div className="toggle-group">
            <button
              className={`toggle ${state.penaltyMode === "reset" ? "active" : ""}`}
              onClick={() => update({ penaltyMode: "reset" as PenaltyMode })}
            >
              💀 Reset complet (retour jeu 1)
            </button>
            <button
              className={`toggle ${state.penaltyMode === "stepback" ? "active" : ""}`}
              onClick={() => update({ penaltyMode: "stepback" as PenaltyMode })}
            >
              ↩️ Recule d'un jeu
            </button>
          </div>
        </div>
      </div>

      {/* POOL */}
      <div className="panel">
        <h2>
          2. Sélection du pool
          <span className="badge">{state.pinned.length} / 5 épinglés</span>
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>
          Clique pour <strong style={{ color: "var(--gold)" }}>épingler jusqu'à 5 jeux</strong> qui seront forcés dans la run. Les autres sont tirés au sort dans le reste du pool.
        </p>

        <div className="pool-controls">
          <input
            type="text"
            className="pool-search"
            placeholder="🔎 Chercher un jeu..."
            value={state.search}
            onChange={(e) => update({ search: e.target.value })}
          />
        </div>

        <div className="filter-pills">
          {getCategories().map((cat) => (
            <button
              key={cat}
              className={`filter-pill ${state.filter === cat ? "active" : ""}`}
              onClick={() => update({ filter: cat })}
            >
              {cat === "all" ? "Toutes" : `${CAT_ICONS[cat] ?? ""} ${cat}`}
            </button>
          ))}
        </div>

        <div className="pool-grid">
          {filteredPool.map((g) => {
            const effMode = effectiveMode(g, state.difficulty);
            const isPinned = state.pinned.includes(g.id);
            let modeLabel = effMode === "solo" ? "⭐ Solo" : effMode === "duo" ? "👥 Duo" : "👨‍👨‍👦 Team";
            if (g.soloHardcore && state.difficulty !== "hardcore") modeLabel += " (HC = Solo)";

            return (
              <div
                key={g.id}
                className={`pool-card ${effMode === "solo" ? "solo" : effMode === "duo" ? "duo" : ""} ${isPinned ? "pinned" : ""}`}
                onClick={() => togglePin(g.id)}
              >
                <div className="pool-card-name">
                  {CAT_ICONS[g.cat] ?? "🎮"} {g.name}
                </div>
                <div className="pool-card-meta">{g.cat}</div>
                <div className="pool-card-mode">{modeLabel}</div>
              </div>
            );
          })}
        </div>

        <div className="generate-row">
          <button className="btn btn-large btn-start" onClick={generateRun}>
            {state.run.length > 0 ? "🎲 Régénérer une nouvelle run" : "🎲 Générer la run (10 jeux)"}
          </button>
          <button className="btn btn-large btn-reroll" onClick={rerollRun} disabled={state.run.length === 0}>
            🔄 Re-roll les jeux aléatoires
          </button>
        </div>
      </div>

      {/* RUN */}
      <div className="panel" id="runPanel">
        <h2>
          3. Run en cours
          {state.run.length > 0 && (
            <span className="badge">
              {state.done.length}/{state.run.length}
            </span>
          )}
        </h2>

        <div className="progress-wrap">
          <div className="progress-info">
            <span>{state.difficulty === "hardcore" ? "🔥 Mode Hardcore" : "🎯 Mode Normal"}</span>
            <span>
              {state.done.length} / {state.run.length || 10}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${state.difficulty === "hardcore" ? "hardcore" : ""}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {state.run.length === 0 ? (
          <div className="empty-run">
            <h3>⚙️ Aucune run générée</h3>
            <p>
              Épingle 0 à 5 jeux ci-dessus puis clique sur <strong>Générer la run</strong>.
            </p>
          </div>
        ) : (
          <div className="games">
            {state.run.map((gameId, idx) => {
              const g = POOL.find((x) => x.id === gameId) as Game | undefined;
              if (!g) return null;

              const isDone = state.done.includes(gameId);
              const isCurrent = idx === state.current && !isDone;
              const isLocked = idx > state.current && !isDone;
              const effMode = effectiveMode(g, state.difficulty);
              const isSolo = effMode === "solo" || effMode === "duo";
              const isPinned = state.pinned.includes(gameId);
              const objective = state.difficulty === "hardcore" ? g.hardcore : g.normal;
              const champion = state.champions[gameId];
              const isDrawing = drawingFor === gameId;

              const classes = [
                "game",
                isLocked ? "locked" : "",
                isCurrent ? "current" : "",
                isDone ? "done" : "",
                isPinned ? "pinned-run" : "",
                swappedIdx === idx ? "swapped" : "",
              ]
                .filter(Boolean)
                .join(" ");

              const modeTagClass = effMode === "solo" ? "solo" : effMode === "duo" ? "duo" : "";
              const modeTagText =
                effMode === "solo"
                  ? `⭐ ${g.cat}`
                  : effMode === "duo"
                  ? `👥 ${g.cat}`
                  : g.cat;

              let championLabel: React.ReactNode = null;
              if (isSolo) {
                if (isDrawing) {
                  championLabel = (
                    <>
                      🎲 Tirage en cours... <span className="name">{drawingDisplay}</span>
                    </>
                  );
                } else if (champion) {
                  championLabel =
                    effMode === "duo" ? (
                      <>
                        🎲 Duo désigné : <span className="name">{champion}</span>
                      </>
                    ) : (
                      <>
                        🎲 Champion désigné : <span className="name">{champion}</span>
                      </>
                    );
                } else {
                  championLabel =
                    effMode === "duo" ? (
                      <>
                        🎲 Aucun duo tiré — <em>Tirage au sort requis</em>
                      </>
                    ) : (
                      <>
                        🎲 Aucun champion tiré — <em>Tirage au sort requis</em>
                      </>
                    );
                }
              }

              return (
                <div key={`${gameId}-${idx}`} className={classes}>
                  <div className="game-num">{String(idx + 1).padStart(2, "0")}</div>
                  <div className="game-info">
                    <div className="game-title-row">
                      <div className="game-title">
                        {CAT_ICONS[g.cat] ?? "🎮"} {g.name}
                      </div>
                      <div className={`game-tag ${modeTagClass}`}>{modeTagText}</div>
                      {isPinned && <div className="game-tag pinned-tag">📌 Épinglé</div>}
                    </div>
                    <div className={`game-objective ${state.difficulty === "hardcore" ? "hc" : ""}`}>
                      Objectif : <strong>{objective}</strong>
                    </div>
                    {isSolo && <div className="game-champion">{championLabel}</div>}
                  </div>
                  <div className="game-actions">
                    {isDone ? (
                      <div className="check">✓</div>
                    ) : (
                      <>
                        <button
                          className="btn btn-swap"
                          onClick={() => swapGame(gameId)}
                          title="On n'a pas ce jeu / on veut le remplacer"
                        >
                          🔄 Swap
                        </button>
                        {isSolo && (
                          <button
                            className="btn btn-draw"
                            disabled={!isCurrent}
                            onClick={() => drawChampion(gameId, effMode as "solo" | "duo")}
                          >
                            🎲 Tirer
                          </button>
                        )}
                        <button className="btn btn-win" disabled={!isCurrent} onClick={() => winGame(gameId)}>
                          ✓ Validé
                        </button>
                        <button className="btn btn-lose" disabled={!isCurrent} onClick={() => loseGame(gameId)}>
                          ✗ Échoué
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GLOBAL CONTROLS */}
      <div className="controls">
        <button className="btn btn-large btn-reset" onClick={hardReset}>
          🗑️ Reset complet
        </button>
      </div>

      {/* RULES */}
      <div className="rules">
        <strong>📜 Règles du Gauntlet</strong>
        <ul>
          <li>
            Vous devez réussir l'objectif des <strong>10 jeux dans l'ordre</strong> sans une seule défaite.
          </li>
          <li>
            Si l'objectif d'un jeu n'est pas atteint, deux pénalités au choix dans la config :{" "}
            <strong>Reset complet</strong> (retour jeu 1) ou <strong>Recule d'un jeu</strong> (retour au jeu précédent).
          </li>
          <li>
            Les jeux marqués <span style={{ color: "var(--gold)", fontWeight: 700 }}>SOLO</span> doivent être réussis par <strong>un seul joueur tiré au sort</strong>.
          </li>
          <li>
            Les jeux marqués <span style={{ color: "var(--accent-2)", fontWeight: 700 }}>DUO</span> doivent être réussis par <strong>2 joueurs tirés au sort</strong>.
          </li>
          <li>
            Mode <strong>Hardcore</strong> : objectifs nettement plus exigeants.
          </li>
          <li>Re-roll : reroll les jeux aléatoires tout en conservant les jeux épinglés.</li>
          <li>Bouton 🔄 Swap par carte : remplace un seul jeu par un autre tiré au sort dans le pool restant.</li>
          <li>La progression est sauvegardée automatiquement dans ce navigateur.</li>
        </ul>
      </div>

      {/* OVERLAYS */}
      {overlay.kind === "win" && (
        <div className="overlay win">
          <div className="overlay-content">
            <h2>🏆 GAUNTLET COMPLETED 🏆</h2>
            <p>Vous avez vaincu les 10 épreuves sans une seule défaite. Le panthéon vous attend.</p>
            <button
              className="btn btn-large btn-win"
              onClick={() => {
                setOverlay({ kind: null });
                fullReset();
              }}
            >
              Recommencer une run
            </button>
          </div>
        </div>
      )}

      {overlay.kind === "lose" && (
        <div className="overlay lose">
          <div className="overlay-content">
            <h2>💀 GAUNTLET FAILED 💀</h2>
            <p>{overlay.msg}</p>
            <button className="btn btn-large btn-lose" onClick={() => setOverlay({ kind: null })}>
              Repartir au combat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
