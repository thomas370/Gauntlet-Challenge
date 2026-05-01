"use client";

import { useEffect, useRef } from "react";
import { IconRefresh, IconDownloadCircle } from "@/lib/icons-svg";
import { formatTime } from "@/lib/timer";

interface Props {
  totalMs: number;
  attempt: number;
  difficulty: "normal" | "hardcore";
  players: string[];
  isPB: boolean;
  previousBestMs?: number;
  onRestart: () => void;
}

export function WinOverlay({ totalMs, attempt, difficulty, players, isPB, previousBestMs, onRestart }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 800;
    const H = 450;
    canvas.width = W;
    canvas.height = H;

    // Background
    ctx.fillStyle = "#0E0D0B";
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "rgba(242, 234, 211, 0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += 32) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Corner brackets
    ctx.strokeStyle = "#C6FF3D";
    ctx.lineWidth = 3;
    const corners = [
      [20, 20, 1, 1], [W - 20, 20, -1, 1],
      [20, H - 20, 1, -1], [W - 20, H - 20, -1, -1],
    ];
    corners.forEach(([x, y, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(x, y + 40 * dy);
      ctx.lineTo(x, y);
      ctx.lineTo(x + 40 * dx, y);
      ctx.stroke();
    });

    // Eyebrow
    ctx.fillStyle = "#C6FF3D";
    ctx.font = "bold 14px 'JetBrains Mono', monospace";
    ctx.fillText("// GAUNTLET CLEARED", 60, 80);

    // Title
    ctx.fillStyle = "#F2EAD3";
    ctx.font = "bold 76px 'Space Grotesk', sans-serif";
    ctx.fillText("10 / 10", 60, 170);

    // Time
    ctx.fillStyle = "#FF5B1F";
    ctx.font = "bold 56px 'JetBrains Mono', monospace";
    ctx.fillText(formatTime(totalMs), 60, 240);

    // Meta
    ctx.fillStyle = "#8C8472";
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.fillText(`MODE        ${difficulty.toUpperCase()}`, 60, 290);
    ctx.fillText(`ATTEMPT     #${String(attempt).padStart(2, "0")}`, 60, 312);
    ctx.fillText(`SQUAD       ${players.filter(Boolean).join(" · ").toUpperCase()}`, 60, 334);
    ctx.fillText(`DATE        ${new Date().toISOString().slice(0, 10)}`, 60, 356);

    // PB stamp
    if (isPB) {
      ctx.save();
      ctx.translate(W - 140, 110);
      ctx.rotate(-0.18);
      ctx.strokeStyle = "#C6FF3D";
      ctx.lineWidth = 3;
      ctx.strokeRect(-70, -28, 140, 56);
      ctx.fillStyle = "#C6FF3D";
      ctx.font = "bold 24px 'Space Grotesk', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("NEW PB", 0, 8);
      ctx.restore();
    }

    // Footer
    ctx.fillStyle = "#5C5648";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText("GAUNTLET // CHALLENGE", 60, H - 40);
  }, [totalMs, attempt, difficulty, players, isPB]);

  const downloadCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `gauntlet-${formatTime(totalMs).replace(":", "-")}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="overlay win" role="dialog" aria-modal="true">
      <div className="overlay-card" style={{ maxWidth: 880 }}>
        <div className="overlay-eyebrow">Gauntlet completed</div>
        <h2 className="overlay-title">10 / 10</h2>
        <p className="overlay-msg">
          {isPB
            ? `Nouveau record personnel : ${formatTime(totalMs)}${previousBestMs ? ` (ancien : ${formatTime(previousBestMs)})` : ""}`
            : `Bouclé en ${formatTime(totalMs)} sur la tentative #${attempt}.`}
        </p>

        <div className="scorecard-wrap">
          <canvas ref={canvasRef} aria-label="Score card" />
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={downloadCard}>
              <IconDownloadCircle size={14} /> Télécharger la carte
            </button>
            <button className="btn btn-primary btn-lg" onClick={onRestart}>
              <IconRefresh size={14} /> Nouvelle run
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
