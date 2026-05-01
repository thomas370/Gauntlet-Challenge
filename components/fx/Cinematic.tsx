"use client";

import { useEffect, useState } from "react";

interface Props {
  nextGameName: string;
  nextIdx: number;
  onDone: () => void;
}

export function Cinematic({ nextGameName, nextIdx, onDone }: Props) {
  const [n, setN] = useState(3);

  useEffect(() => {
    if (n === 0) {
      const t = setTimeout(onDone, 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [n, onDone]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter" || e.code === "Escape") {
        e.preventDefault();
        onDone();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDone]);

  return (
    <div className="cinematic" role="alert" aria-live="assertive">
      <div className="cinematic-inner">
        <div className="cinematic-eyebrow">Jeu {String(nextIdx + 1).padStart(2, "0")} · entrant</div>
        <div key={n} className={`cinematic-num ${n === 0 ? "go" : ""}`}>{n > 0 ? n : "GO"}</div>
        <div className="cinematic-game">{nextGameName}</div>
        <div className="cinematic-skip">[espace] passer</div>
      </div>
    </div>
  );
}
