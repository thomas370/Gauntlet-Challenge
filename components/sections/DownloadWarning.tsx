import { IconAlert, IconDownload, IconX, IconPlay } from "@/lib/icons-svg";
import type { Game } from "@/lib/types";

interface Props {
  games: Game[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function DownloadWarning({ games, onConfirm, onCancel }: Props) {
  const unique = Array.from(new Set(games.map((g) => g.name)));

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="dl-title">
      <div className="overlay-card" style={{ maxWidth: 720, textAlign: "left" }}>
        <div className="overlay-eyebrow" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IconAlert size={14} /> // Pré-flight check
        </div>
        <h2 id="dl-title" className="overlay-title" style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>
          Avant de lancer
        </h2>
        <p className="overlay-msg" style={{ textAlign: "left" }}>
          Assure-toi que <strong style={{ color: "var(--bone)" }}>tous les jeux ci-dessous sont installés</strong> et prêts à lancer sur les machines des joueurs. Une fois la run lancée, le timer démarre — pas de pause prévue pour télécharger.
        </p>

        <div style={{
          background: "var(--ink)",
          border: "1px solid var(--ink-3)",
          padding: "16px",
          maxHeight: 280,
          overflowY: "auto",
          marginBottom: 24,
        }}>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--bone-dim)",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <IconDownload size={12} /> {unique.length} jeux à préparer
          </div>
          <ul style={{
            listStyle: "none",
            padding: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "8px 16px",
          }}>
            {unique.map((name, i) => (
              <li key={name} style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--bone)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span style={{ color: "var(--ember)", fontWeight: 700 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {name}
              </li>
            ))}
          </ul>
        </div>

        <div className="btn-row" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onCancel}>
            <IconX size={14} /> Annuler
          </button>
          <button className="btn btn-primary btn-lg" onClick={onConfirm} autoFocus>
            <IconPlay size={14} /> Tout est installé · démarrer
          </button>
        </div>
      </div>
    </div>
  );
}
