interface Props {
  attempt: number;
  difficulty: "normal" | "hardcore";
  inRun: boolean;
}

export function Hero({ attempt, difficulty, inRun }: Props) {
  return (
    <header className="hero">
      <div className="hero-eyebrow">// 10 jeux · 0 défaite autorisée</div>
      <h1 className="hero-title">
        Gaunt<span className="slash">/</span>let
      </h1>
      <div className="hero-meta">
        <span><span className="dot" /> Tentative <strong>#{String(attempt).padStart(2, "0")}</strong></span>
        <span>Mode <strong>{difficulty === "hardcore" ? "Hardcore" : "Normal"}</strong></span>
        <span>Statut <strong>{inRun ? "Run active" : "En attente"}</strong></span>
      </div>
    </header>
  );
}
