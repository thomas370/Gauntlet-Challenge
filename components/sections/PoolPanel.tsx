import { IconSearch, IconPin, IconStar, IconUsers, IconDice, IconShuffle } from "@/lib/icons-svg";
import type { Game, Difficulty } from "@/lib/types";
import { effectiveMode } from "@/lib/games";

interface Props {
  pool: Game[];
  filteredPool: Game[];
  categories: string[];
  difficulty: Difficulty;
  pinned: number[];
  filter: string;
  search: string;
  onFilterChange: (f: string) => void;
  onSearchChange: (s: string) => void;
  onTogglePin: (id: number) => void;
  onGenerate: () => void;
  onReroll: () => void;
  hasRun: boolean;
}

export function PoolPanel({
  filteredPool, categories, difficulty, pinned, filter, search,
  onFilterChange, onSearchChange, onTogglePin, onGenerate, onReroll, hasRun,
}: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <div className="panel-num">02 / pool</div>
          <h2 className="panel-title">Sélection des jeux</h2>
        </div>
        <div className="panel-meta">{pinned.length} / 5 épinglés</div>
      </div>

      <p style={{ color: "var(--bone-dim)", fontSize: 13, marginBottom: 16, fontFamily: "var(--font-mono)" }}>
        Clique pour épingler jusqu'à <strong style={{ color: "var(--gold)" }}>5 jeux forcés</strong> dans la run. Les autres sont tirés au sort.
      </p>

      <div className="pool-toolbar">
        <div className="search-wrap">
          <IconSearch className="icon" />
          <input
            className="search-input"
            type="text"
            placeholder="Chercher un jeu..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Rechercher dans le pool"
          />
        </div>
        <div className="filter-row">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`chip ${filter === cat ? "active" : ""}`}
              onClick={() => onFilterChange(cat)}
            >
              {cat === "all" ? "Toutes" : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="pool-grid" role="list">
        {filteredPool.map((g) => {
          const effMode = effectiveMode(g, difficulty);
          const isPinned = pinned.includes(g.id);
          const modeClass = effMode === "solo" ? "solo" : effMode === "duo" ? "duo" : "";
          const ModeIcon = effMode === "solo" ? IconStar : effMode === "duo" ? IconUsers : IconUsers;
          const modeLabel = effMode === "solo" ? "Solo" : effMode === "duo" ? "Duo" : "Team";

          return (
            <button
              key={g.id}
              role="listitem"
              type="button"
              className={`pool-card ${isPinned ? "pinned" : ""}`}
              onClick={() => onTogglePin(g.id)}
              aria-pressed={isPinned}
            >
              <div className="pool-card-head">
                <span>{g.name}</span>
              </div>
              <div className="pool-card-cat">{g.cat}</div>
              <div className={`pool-card-mode ${modeClass}`}>
                <ModeIcon size={11} /> {modeLabel}
                {g.soloHardcore && difficulty !== "hardcore" && <span style={{ color: "var(--bone-low)" }}>· HC=Solo</span>}
              </div>
              {isPinned && <span className="pool-pin"><IconPin size={14} /></span>}
            </button>
          );
        })}
      </div>

      <div className="generate-row">
        <button className="btn btn-primary btn-lg" onClick={onGenerate}>
          <IconDice /> {hasRun ? "Régénérer une run" : "Générer la run (10 jeux)"}
        </button>
        <button className="btn btn-ghost btn-lg" onClick={onReroll} disabled={!hasRun}>
          <IconShuffle /> Re-roll les aléatoires
        </button>
      </div>
    </section>
  );
}
