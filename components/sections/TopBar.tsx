"use client";

import { useEffect, useState, useRef } from "react";
import { formatTime } from "@/lib/timer";

interface Props {
  run: number[];
  done: number[];
  current: number;
  flashLossIdx: number | null;
  startTs: number | null;
  pbMs: number | null;
}

export function TopBar({ run, done, current, flashLossIdx, startTs, pbMs }: Props) {
  const [now, setNow] = useState<number>(() => Date.now());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startTs) return;
    const tick = () => {
      setNow(Date.now());
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [startTs]);

  const elapsed = startTs ? now - startTs : 0;
  const slots = Array.from({ length: 10 }, (_, i) => i);

  return (
    <div className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true" />
        <div className="brand-text">Gauntlet<em> Challenge</em></div>
      </div>

      <nav className="chain" aria-label="Progression de la run">
        {slots.map((i) => {
          const gameId = run[i];
          const isDone = gameId !== undefined && done.includes(gameId);
          const isCurrent = run.length > 0 && i === current && !isDone;
          const flash = flashLossIdx === i;
          const cls = ["chain-node",
            isDone ? "done" : "",
            isCurrent ? "current" : "",
            flash ? "flash-loss" : ""
          ].filter(Boolean).join(" ");
          return (
            <div key={i} className={cls} title={`Jeu ${i + 1}`} aria-label={`Jeu ${i + 1} ${isDone ? "validé" : isCurrent ? "en cours" : "à venir"}`} />
          );
        })}
      </nav>

      <div className="timer-block" aria-live="polite">
        <div className={`timer-main ${startTs ? "running" : ""}`}>
          {formatTime(elapsed)}
        </div>
        <div className={`timer-sub ${pbMs && elapsed > 0 && elapsed < pbMs ? "pb" : ""}`}>
          {pbMs ? `Record · ${formatTime(pbMs)}` : "Pas de record"}
        </div>
      </div>
    </div>
  );
}
