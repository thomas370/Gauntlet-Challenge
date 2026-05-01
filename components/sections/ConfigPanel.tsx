import { IconFlame, IconTarget, IconSkull, IconArrowLeft } from "@/lib/icons-svg";
import type { Difficulty, PenaltyMode } from "@/lib/types";

interface Props {
  players: string[];
  playerCount: number;
  difficulty: Difficulty;
  penaltyMode: PenaltyMode;
  onPlayersChange: (players: string[]) => void;
  onPlayerCountChange: (n: number) => void;
  onDifficultyChange: (d: Difficulty) => void;
  onPenaltyChange: (p: PenaltyMode) => void;
}

export function ConfigPanel({
  players, playerCount, difficulty, penaltyMode,
  onPlayersChange, onPlayerCountChange, onDifficultyChange, onPenaltyChange,
}: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <div className="panel-num">// 01 — Setup</div>
          <h2 className="panel-title">Configuration</h2>
        </div>
        <div className="panel-meta">{playerCount} joueurs · {difficulty}</div>
      </div>

      <div className="grid-3">
        {[0, 1, 2].map((i) => (
          <div className="field" key={i}>
            <label className="field-label" htmlFor={`player-${i}`}>Joueur {i + 1}</label>
            <input
              id={`player-${i}`}
              className="input"
              type="text"
              value={players[i] ?? ""}
              placeholder={`Pseudo ${i + 1}`}
              onChange={(e) => {
                const next = [...players];
                next[i] = e.target.value;
                onPlayersChange(next);
              }}
            />
          </div>
        ))}
        <div className="field">
          <label className="field-label" htmlFor="playercount">Effectif</label>
          <select
            id="playercount"
            className="select"
            value={playerCount}
            onChange={(e) => onPlayerCountChange(parseInt(e.target.value))}
          >
            <option value={2}>2 joueurs</option>
            <option value={3}>3 joueurs</option>
          </select>
        </div>
      </div>

      <div className="field" style={{ marginTop: 24 }}>
        <label className="field-label">Difficulté</label>
        <div className="toggle-group" role="tablist">
          <button
            role="tab"
            aria-selected={difficulty === "normal"}
            className={`toggle ${difficulty === "normal" ? "active" : ""}`}
            onClick={() => onDifficultyChange("normal")}
          >
            <IconTarget /> Normal
          </button>
          <button
            role="tab"
            aria-selected={difficulty === "hardcore"}
            className={`toggle ${difficulty === "hardcore" ? "active danger" : ""}`}
            onClick={() => onDifficultyChange("hardcore")}
          >
            <IconFlame /> Hardcore
          </button>
        </div>
      </div>

      <div className="field" style={{ marginTop: 16 }}>
        <label className="field-label">Pénalité en cas de défaite</label>
        <div className="toggle-group" role="tablist">
          <button
            role="tab"
            aria-selected={penaltyMode === "reset"}
            className={`toggle ${penaltyMode === "reset" ? "active" : ""}`}
            onClick={() => onPenaltyChange("reset")}
          >
            <IconSkull /> Reset complet
          </button>
          <button
            role="tab"
            aria-selected={penaltyMode === "stepback"}
            className={`toggle ${penaltyMode === "stepback" ? "active" : ""}`}
            onClick={() => onPenaltyChange("stepback")}
          >
            <IconArrowLeft /> Recule d'un jeu
          </button>
        </div>
      </div>
    </section>
  );
}
