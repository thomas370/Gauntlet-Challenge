interface Props {
  attempt: number;
  difficulty: "normal" | "hardcore";
  inRun: boolean;
}

export function Hero({ attempt, difficulty, inRun }: Props) {
  return (
    <header className="hero">
      <div className="hero-eyebrow">10 jeux · 0 défaite autorisée</div>
      <h1 className="hero-title">
        Gauntlet<span className="slash">.</span>
      </h1>
      <div className="hero-meta">
        <span><span className="label">Tentative</span><strong>#{String(attempt).padStart(2, "0")}</strong></span>
        <span><span className="label">Mode</span><strong>{difficulty === "hardcore" ? "Hardcore" : "Normal"}</strong></span>
        <span><span className="label">Statut</span><strong>{inRun ? "Run active" : "En attente"}</strong></span>
      </div>
    </header>
  );
}
