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
        Gaunt<span className="slash">/</span>let
      </h1>
      <div className="hero-meta">
        <span><span className="label">tentative</span><strong>#{String(attempt).padStart(2, "0")}</strong></span>
        <span><span className="label">mode</span><strong>{difficulty === "hardcore" ? "hardcore" : "normal"}</strong></span>
        <span><span className="label">statut</span><strong>{inRun ? "active" : "en attente"}</strong></span>
      </div>
    </header>
  );
}
