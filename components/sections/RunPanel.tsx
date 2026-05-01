import { IconCheck, IconX, IconDice, IconShuffle, IconStar, IconUsers, IconPin, IconFlame, IconTarget } from "@/lib/icons-svg";
import type { Game, Difficulty } from "@/lib/types";
import { effectiveMode } from "@/lib/games";

interface Props {
  run: number[];
  pool: Game[];
  done: number[];
  current: number;
  pinned: number[];
  difficulty: Difficulty;
  champions: Record<number, string>;
  drawingFor: number | null;
  drawingDisplay: string;
  swappedIdx: number | null;
  onSwap: (id: number) => void;
  onDraw: (id: number, mode: "solo" | "duo") => void;
  onWin: (id: number) => void;
  onLose: (id: number) => void;
}

export function RunPanel({
  run, pool, done, current, pinned, difficulty, champions,
  drawingFor, drawingDisplay, swappedIdx,
  onSwap, onDraw, onWin, onLose,
}: Props) {
  const progressPct = run.length === 0 ? 0 : (done.length / run.length) * 100;

  return (
    <section className="panel" id="runPanel">
      <div className="panel-head">
        <div>
          <div className="panel-num">// 03 — Run</div>
          <h2 className="panel-title">Gauntlet en cours</h2>
        </div>
        <div className="panel-meta">{done.length} / {run.length || 10} validés</div>
      </div>

      <div className="progress-meta">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          {difficulty === "hardcore" ? <IconFlame size={12} /> : <IconTarget size={12} />}
          Mode {difficulty === "hardcore" ? "Hardcore" : "Normal"}
        </span>
        <span className="count">{done.length} / {run.length || 10}</span>
      </div>
      <div className="progress-track" role="progressbar" aria-valuenow={done.length} aria-valuemax={run.length || 10}>
        <div
          className={`progress-fill ${difficulty === "hardcore" ? "hardcore" : ""}`}
          style={{ transform: `scaleX(${progressPct / 100})` }}
        />
      </div>

      {run.length === 0 ? (
        <div className="empty-run">
          <h3>Aucune run générée</h3>
          <p>Configure tes joueurs, épingle 0-5 jeux, puis génère.</p>
        </div>
      ) : (
        <div className="games" role="list">
          {run.map((gameId, idx) => {
            const g = pool.find((x) => x.id === gameId);
            if (!g) return null;
            const isDone = done.includes(gameId);
            const isCurrent = idx === current && !isDone;
            const isLocked = idx > current && !isDone;
            const effMode = effectiveMode(g, difficulty);
            const isSolo = effMode === "solo" || effMode === "duo";
            const isPinned = pinned.includes(gameId);
            const objective = difficulty === "hardcore" ? g.hardcore : g.normal;
            const champion = champions[gameId];
            const isDrawing = drawingFor === gameId;

            const cls = ["game",
              isLocked ? "locked" : "",
              isCurrent ? "current" : "",
              isDone ? "done" : "",
              swappedIdx === idx ? "swapped" : "",
            ].filter(Boolean).join(" ");

            return (
              <div key={`${gameId}-${idx}`} className={cls} role="listitem">
                <div className="game-num">{String(idx + 1).padStart(2, "0")}</div>

                <div className="game-info">
                  <div className="game-title-row">
                    <div className="game-title">{g.name}</div>
                    <span className="badge">{g.cat}</span>
                    {effMode === "solo" && <span className="badge badge-gold"><IconStar size={9} /> Solo</span>}
                    {effMode === "duo"  && <span className="badge badge-ember"><IconUsers size={9} /> Duo</span>}
                    {isPinned          && <span className="badge badge-gold"><IconPin size={9} /> Pin</span>}
                  </div>
                  <div className={`game-objective ${difficulty === "hardcore" ? "hc" : ""}`}>
                    Objectif : <strong>{objective}</strong>
                  </div>
                  {isSolo && (
                    <div className={`game-champion ${isDrawing ? "drawing" : ""}`}>
                      {isDrawing ? (
                        <>Tirage en cours · <span className="name">{drawingDisplay}</span></>
                      ) : champion ? (
                        <>{effMode === "duo" ? "Duo désigné" : "Champion"} · <span className="name">{champion}</span></>
                      ) : (
                        <>Aucun {effMode === "duo" ? "duo" : "champion"} tiré · tirage requis</>
                      )}
                    </div>
                  )}
                </div>

                <div className="game-actions">
                  {isDone ? (
                    <div className="check-mark" aria-label="Validé"><IconCheck size={18} /></div>
                  ) : (
                    <>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => onSwap(gameId)}
                        title="Remplacer ce jeu"
                      >
                        <IconShuffle size={12} /> Swap
                      </button>
                      {isSolo && (
                        <button
                          className="btn btn-sm"
                          disabled={!isCurrent}
                          onClick={() => onDraw(gameId, effMode as "solo" | "duo")}
                        >
                          <IconDice size={12} /> Tirer
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-success"
                        disabled={!isCurrent}
                        onClick={() => onWin(gameId)}
                      >
                        <IconCheck size={12} /> Validé
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        disabled={!isCurrent}
                        onClick={() => onLose(gameId)}
                      >
                        <IconX size={12} /> Échoué
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
