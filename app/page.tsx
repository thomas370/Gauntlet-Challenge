"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { POOL, getCategories, effectiveMode } from "@/lib/games";
import { CAT_ICONS } from "@/lib/icons";
import {
 DEFAULT_STATE,
 type GauntletState,
 type Difficulty,
 type PenaltyMode,
 type Game,
 type RunHistoryEntry,
} from "@/lib/types";

// === ICONS (Lucide-style inline SVG) ===
const ICON_PATHS: Record<string, React.ReactNode> = {
  dice: (<><rect x="2" y="2" width="10" height="10" rx="2"/><rect x="12" y="12" width="10" height="10" rx="2"/><circle cx="7" cy="7" r="0.5" fill="currentColor"/><circle cx="17" cy="17" r="0.5" fill="currentColor"/></>),
  refresh: (<><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>),
  check: (<polyline points="20 6 9 17 4 12"/>),
  x: (<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>),
  trash: (<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></>),
  volume: (<><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>),
  volumeOff: (<><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></>),
  pin: (<><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></>),
  sparkles: (<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>),
  trophy: (<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></>),
  skull: (<><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/></>),
  search: (<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>),
  eye: (<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>),
  eyeOff: (<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>),
  star: (<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>),
  users: (<><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>),
  user: (<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>),
  list: (<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>),
};
function Icon({ name, size = 14, fill = "none" }: { name: string; size?: number; fill?: string }) {
  const path = ICON_PATHS[name];
  if (!path) return null;
  const strokeWidth = name === "check" || name === "x" ? 2.5 : 2;
  const fillProp = name === "star" ? "currentColor" : fill;
  return (
    <span className="icon">
      <svg width={size} height={size} viewBox="0 0 24 24" fill={fillProp} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{path}</svg>
    </span>
  );
}

// === GAME COVER (Steam library art) ===
function GameCover({ appid, name, size = "md" }: { appid?: number; name: string; size?: "sm" | "md" | "lg" }) {
  if (!appid) {
    return (
      <div className={`game-cover game-cover-${size} game-cover-fallback`}>
        <span>{name.slice(0, 2).toUpperCase()}</span>
      </div>
    );
  }
  return (
    <div className={`game-cover game-cover-${size}`}>
      <img
        src={`https://cdn.akamai.steamstatic.com/steam/apps/${appid}/library_600x900.jpg`}
        alt={name}
        loading="lazy"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    </div>
  );
}

const STORAGE_KEY = "gauntlet_v3";

function shuffle<T>(arr: T[]): T[] {
 const a = [...arr];
 for (let i = a.length - 1; i > 0; i--) {
 const j = Math.floor(Math.random() * (i + 1));
 [a[i], a[j]] = [a[j], a[i]];
 }
 return a;
}

function fmtDuration(ms: number): string {
 if (!ms || ms < 0) return "—";
 const s = Math.floor(ms / 1000);
 const m = Math.floor(s / 60);
 const h = Math.floor(m / 60);
 if (h > 0) return `${h}h${(m % 60).toString().padStart(2, "0")}`;
 if (m > 0) return `${m}m${(s % 60).toString().padStart(2, "0")}s`;
 return `${s}s`;
}

function fmtDate(ts: number): string {
 const d = new Date(ts);
 return (
 d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) +
 " " +
 d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
 );
}

export default function Page() {
 const [state, setState] = useState<GauntletState>(DEFAULT_STATE);
 const [hydrated, setHydrated] = useState(false);
 const [overlay, setOverlay] = useState<{ kind: "win" | "lose" | null; msg?: string }>({ kind: null });
 const [drawingFor, setDrawingFor] = useState<number | null>(null);
 const [slotData, setSlotData] = useState<{
 reels: string[][];
 final: string[];
 locked: boolean[];
 } | null>(null);
 const [swappedIdx, setSwappedIdx] = useState<number | null>(null);
 const [shaking, setShaking] = useState(false);
 const [pendingRun, setPendingRun] = useState<number[] | null>(null);
 const [reviewing, setReviewing] = useState(false);
 const [countdown, setCountdown] = useState<number | null>(null);
 const [now, setNow] = useState<number>(Date.now());
 const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
 const audioCtxRef = useRef<AudioContext | null>(null);
 const confettiRef = useRef<HTMLCanvasElement | null>(null);
 const particlesRef = useRef<HTMLDivElement | null>(null);

 // Hydrate from localStorage on mount
 useEffect(() => {
 try {
 const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
 if (raw) {
 const parsed = JSON.parse(raw);
 setState({ ...DEFAULT_STATE, ...parsed });
 }
 } catch (e) {
 console.warn("Load failed", e);
 }
 setHydrated(true);
 }, []);

 // Persist on every change
 useEffect(() => {
 if (!hydrated) return;
 try {
 localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
 } catch (e) {
 console.warn("Save failed", e);
 }
 }, [state, hydrated]);

  // === LIVE TIMER (ticks every second while run active) ===
  useEffect(() => {
    if (!state.runStartTime || state.run.length === 0 || state.done.length === state.run.length) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [state.runStartTime, state.run.length, state.done.length]);

  // === COUNTDOWN ===
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
      return () => clearTimeout(t);
    }
    // countdown reached 0 -> start the run
    if (pendingRun) {
      setState((s) => ({
        ...s,
        run: pendingRun,
        current: 0,
        done: [],
        champions: {},
        attempt: 1,
        runStartTime: Date.now(),
        runFails: {},
      }));
      setPendingRun(null);
    }
    const t = setTimeout(() => setCountdown(null), 600);
    return () => clearTimeout(t);
  }, [countdown, pendingRun]);


 // === SOUND ===
 const initAudio = () => {
 if (!audioCtxRef.current) {
 try {
 const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
 audioCtxRef.current = new Ctx();
 } catch (e) {
 console.warn("Audio not supported");
 }
 }
 };
 const beep = (freq: number, duration: number, type: OscillatorType = "sine", volume = 0.15) => {
 if (!state.soundEnabled || !audioCtxRef.current) return;
 const ctx = audioCtxRef.current;
 const osc = ctx.createOscillator();
 const gain = ctx.createGain();
 osc.type = type;
 osc.frequency.value = freq;
 gain.gain.setValueAtTime(volume, ctx.currentTime);
 gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
 osc.connect(gain).connect(ctx.destination);
 osc.start();
 osc.stop(ctx.currentTime + duration);
 };
 const playClick = () => {
 if (!state.soundEnabled) return;
 initAudio();
 beep(800, 0.04, "square", 0.07);
 };
 const playLose = () => {
 if (!state.soundEnabled) return;
 initAudio();
 [400, 300, 200, 100].forEach((f, i) => setTimeout(() => beep(f, 0.3, "sawtooth", 0.18), i * 100));
 };
 const playGauntletWin = () => {
 if (!state.soundEnabled) return;
 initAudio();
 [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) =>
 setTimeout(() => beep(f, 0.18, "triangle", 0.2), i * 100)
 );
 };

 // First click unlocks audio context (browser policy)
 useEffect(() => {
 const handler = () => initAudio();
 document.addEventListener("click", handler, { once: true });
 return () => document.removeEventListener("click", handler);
 }, []);

 // === CONFETTI ===
 const fireConfetti = (intensity = 1) => {
 const canvas = confettiRef.current;
 if (!canvas) return;
 const ctx = canvas.getContext("2d");
 if (!ctx) return;
 canvas.width = window.innerWidth;
 canvas.height = window.innerHeight;
 const colors = ["#00f0a8", "#7c5cff", "#ffd23f", "#ff3860", "#ffffff"];
 const count = Math.floor(180 * intensity);
 type P = { x: number; y: number; vx: number; vy: number; g: number; size: number; color: string; rot: number; vr: number; life: number };
 const particles: P[] = [];
 for (let i = 0; i < count; i++) {
 particles.push({
 x: canvas.width / 2 + (Math.random() - 0.5) * 200,
 y: canvas.height / 2,
 vx: (Math.random() - 0.5) * 18,
 vy: (Math.random() - 1) * 14 - 6,
 g: 0.4,
 size: 4 + Math.random() * 6,
 color: colors[Math.floor(Math.random() * colors.length)],
 rot: Math.random() * 360,
 vr: (Math.random() - 0.5) * 12,
 life: 0,
 });
 }
 let frame = 0;
 const tick = () => {
 ctx.clearRect(0, 0, canvas.width, canvas.height);
 let alive = 0;
 particles.forEach((p) => {
 if (p.y > canvas.height + 50) return;
 alive++;
 p.vy += p.g;
 p.x += p.vx;
 p.y += p.vy;
 p.rot += p.vr;
 p.life++;
 ctx.save();
 ctx.translate(p.x, p.y);
 ctx.rotate((p.rot * Math.PI) / 180);
 ctx.fillStyle = p.color;
 ctx.globalAlpha = Math.max(0, 1 - p.life / 200);
 ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.4);
 ctx.restore();
 });
 frame++;
 if (alive > 0 && frame < 400) requestAnimationFrame(tick);
 else ctx.clearRect(0, 0, canvas.width, canvas.height);
 };
 requestAnimationFrame(tick);
 };

 // Resize confetti canvas on window resize
 useEffect(() => {
 const onResize = () => {
 const c = confettiRef.current;
 if (c) {
 c.width = window.innerWidth;
 c.height = window.innerHeight;
 }
 };
 window.addEventListener("resize", onResize);
 return () => window.removeEventListener("resize", onResize);
 }, []);

 // === BACKGROUND PARTICLES ===
 useEffect(() => {
 const interval = setInterval(() => {
 if (document.hidden || !particlesRef.current) return;
 const p = document.createElement("div");
 const colorClass = ["", "purple", "gold"][Math.floor(Math.random() * 3)];
 p.className = "particle " + colorClass;
 p.style.left = Math.random() * 100 + "vw";
 const dur = 8 + Math.random() * 12;
 p.style.animationDuration = dur + "s";
 particlesRef.current.appendChild(p);
 setTimeout(() => p.remove(), dur * 1000);
 }, 700);
 return () => clearInterval(interval);
 }, []);

 // === TILT 3D ===
 useEffect(() => {
 const cards = document.querySelectorAll<HTMLDivElement>(".game.tiltable");
 const handlers: Array<{ el: HTMLDivElement; move: (e: MouseEvent) => void; leave: () => void }> = [];
 cards.forEach((card) => {
 const move = (e: MouseEvent) => {
 const rect = card.getBoundingClientRect();
 const x = (e.clientX - rect.left) / rect.width - 0.5;
 const y = (e.clientY - rect.top) / rect.height - 0.5;
 card.style.transform = `perspective(900px) rotateX(${-y * 4}deg) rotateY(${x * 6}deg)`;
 };
 const leave = () => {
 card.style.transform = "";
 };
 card.addEventListener("mousemove", move);
 card.addEventListener("mouseleave", leave);
 handlers.push({ el: card, move, leave });
 });
 return () => {
 handlers.forEach((h) => {
 h.el.removeEventListener("mousemove", h.move);
 h.el.removeEventListener("mouseleave", h.leave);
 });
 };
 }, [state.run, state.current, state.done.length, drawingFor]);

 // === SHAKE ===
 const shakeScreen = () => {
 setShaking(false);
 setTimeout(() => setShaking(true), 10);
 setTimeout(() => setShaking(false), 600);
 };

 useEffect(() => {
 document.body.classList.toggle("shake", shaking);
 }, [shaking]);

 // === HELPERS ===
 const update = (patch: Partial<GauntletState>) => setState((s) => ({ ...s, ...patch }));

 const togglePin = (id: number) => {
 setState((s) => {
 if (s.pinned.includes(id)) {
 return { ...s, pinned: s.pinned.filter((x) => x !== id) };
 } else if (s.pinned.length < 5) {
 playClick();
 return { ...s, pinned: [...s.pinned, id] };
 } else {
 alert("Maximum 5 jeux épinglés. Retire-en un avant d'en ajouter un autre.");
 return s;
 }
 });
 };

 const generateRun = () => {
 const pinned = [...state.pinned];
 const others = POOL.filter((g) => !pinned.includes(g.id));
 const remainingNeeded = 10 - pinned.length;
 if (remainingNeeded > others.length) {
 alert("Pas assez de jeux dans le pool !");
 return;
 }
 const random = shuffle(others).slice(0, remainingNeeded).map((g) => g.id);
 const run = shuffle([...pinned, ...random]);
 setPendingRun(run);
 setReviewing(true);
 playClick();
 };

 const swapInPending = (gameId: number) => {
 if (!pendingRun) return;
 const idx = pendingRun.indexOf(gameId);
 if (idx === -1) return;
 const available = POOL.filter((g) => !pendingRun.includes(g.id));
 if (available.length === 0) {
 alert("Plus aucun jeu disponible dans le pool pour swap.");
 return;
 }
 const newGame = available[Math.floor(Math.random() * available.length)];
 const newRun = [...pendingRun];
 newRun[idx] = newGame.id;
 setPendingRun(newRun);
 playClick();
 };

 const confirmRun = () => {
 if (!pendingRun) return;
 setReviewing(false);
 setCountdown(3);
 playClick();
 };

 const cancelReview = () => {
 setPendingRun(null);
 setReviewing(false);
 };

 const steamSearchUrl = (name: string) =>
 `https://store.steampowered.com/search/?term=${encodeURIComponent(name)}`;

 const elapsed = state.runStartTime && state.run.length > 0 ? now - state.runStartTime : 0;

 const rerollRun = () => {
 if (state.run.length === 0) return;
 if (state.done.length > 0 && !confirm("Une run est en cours. Re-roll va tout remettre à zéro. Continuer ?")) return;
 generateRun();
 };

 const swapGame = (gameId: number) => {
 if (state.done.includes(gameId)) {
 alert("Ce jeu est déjà validé, impossible de le swap.");
 return;
 }
 setState((s) => {
 const idx = s.run.indexOf(gameId);
 if (idx === -1) return s;
 const available = POOL.filter((g) => !s.run.includes(g.id));
 if (available.length === 0) {
 alert("Plus aucun jeu disponible dans le pool pour swap.");
 return s;
 }
 const newGame = available[Math.floor(Math.random() * available.length)];
 const newRun = [...s.run];
 newRun[idx] = newGame.id;
 const newPinned = s.pinned.filter((x) => x !== gameId);
 const newChampions = { ...s.champions };
 delete newChampions[gameId];
 setSwappedIdx(idx);
 if (swapTimer.current) clearTimeout(swapTimer.current);
 swapTimer.current = setTimeout(() => setSwappedIdx(null), 700);
 return { ...s, run: newRun, pinned: newPinned, champions: newChampions };
 });
 playClick();
 };

 // === SLOT MACHINE DRAW ===
 const drawChampion = (gameId: number, mode: "solo" | "duo") => {
 const players = state.players.slice(0, state.playerCount).filter((p) => p && p.trim());
 if (players.length === 0) {
 alert("Saisis au moins le pseudo de tes joueurs en haut de la page !");
 return;
 }
 if (mode === "duo" && players.length < 2) {
 alert("Il faut au moins 2 joueurs pour un duo.");
 return;
 }
 initAudio();

 let final: string[];
 if (mode === "duo" && players.length >= 2) {
 const sh = shuffle(players);
 final = [sh[0], sh[1]];
 } else {
 final = [players[Math.floor(Math.random() * players.length)]];
 }

 const reelCount = final.length;
 const cyclesPerReel = [10, 14, 18];
 const reels: string[][] = [];
 for (let r = 0; r < reelCount; r++) {
 const cells: string[] = [];
 const totalCells = cyclesPerReel[r] + 1;
 for (let i = 0; i < totalCells; i++) {
 cells.push(i === totalCells - 1 ? final[r] : players[Math.floor(Math.random() * players.length)]);
 }
 reels.push(cells);
 }

 // Force-render the slot machine DOM before reading element refs
 flushSync(() => {
 setDrawingFor(gameId);
 setSlotData({ reels, final, locked: final.map(() => false) });
 });

 const stripCellHeight = 32;
 // Wait one paint cycle to ensure layout is committed
 requestAnimationFrame(() => {
 const promises = final.map((_, r) => {
 const strip = document.getElementById(`strip${r}`) as HTMLDivElement | null;
 if (!strip) {
 console.warn(`strip${r} not found in DOM`);
 return Promise.resolve();
 }
 const totalCells = cyclesPerReel[r] + 1;
 const targetY = (totalCells - 1) * stripCellHeight;
 const duration = 1200 + r * 400;
 const start = performance.now();
 return new Promise<void>((resolve) => {
 let lastCell = -1;
 const frame = (now: number) => {
 const t = Math.min(1, (now - start) / duration);
 const ease = 1 - Math.pow(1 - t, 3);
 const y = ease * targetY;
 strip.style.transform = `translateY(-${y}px)`;
 if (t < 1) {
 const cellsPassed = Math.floor(y / stripCellHeight);
 if (cellsPassed !== lastCell) {
 lastCell = cellsPassed;
 beep(300 + Math.random() * 200, 0.04, "square", 0.05);
 }
 requestAnimationFrame(frame);
 } else {
 setSlotData((prev) => {
 if (!prev) return prev;
 const newLocked = [...prev.locked];
 newLocked[r] = true;
 return { ...prev, locked: newLocked };
 });
 beep(800, 0.08, "triangle", 0.18);
 resolve();
 }
 };
 requestAnimationFrame(frame);
 });
 });

 Promise.all(promises).then(() => {
 setTimeout(() => {
 const finalName = mode === "duo" ? `${final[0]} & ${final[1]}` : final[0];
 setState((s) => ({ ...s, champions: { ...s.champions, [gameId]: finalName } }));
 setDrawingFor(null);
 setSlotData(null);
 }, 350);
 });
 });
 };

 // === HISTORY ===
 const logRunToHistory = (
 s: GauntletState,
 outcome: "win" | "lose",
 failedGameId: number | null = null
 ): RunHistoryEntry[] => {
 if (!s.runStartTime) return s.history;
 const entry: RunHistoryEntry = {
 id: Date.now(),
 ts: Date.now(),
 outcome,
 attempts: s.attempt,
 duration: Date.now() - s.runStartTime,
 difficulty: s.difficulty,
 penaltyMode: s.penaltyMode,
 runIds: [...s.run],
 failedGameId,
 championPicks: { ...s.champions },
 completed: s.done.length,
 total: s.run.length,
 };
 return [entry, ...(s.history || [])].slice(0, 50);
 };

 // === WIN / LOSE ===
 const winGame = (gameId: number) => {
 setState((s) => {
 if (s.done.includes(gameId)) return s;
 const newDone = [...s.done, gameId];
 const newCurrent = s.current + 1;
 let next: GauntletState = { ...s, done: newDone, current: newCurrent };
 if (newDone.length === s.run.length) {
 // FULL GAUNTLET
 next = { ...next, history: logRunToHistory({ ...next }, "win") };
 setTimeout(() => {
 fireConfetti(2);
 playGauntletWin();
 setOverlay({ kind: "win" });
 }, 400);
 }
 return next;
 });
 playClick();
 fireConfetti(0.15);
 };

 const loseGame = (gameId: number) => {
 setState((s) => {
 const g = POOL.find((x) => x.id === gameId);
 const idx = s.run.indexOf(gameId);
 const runFails = { ...s.runFails, [gameId]: (s.runFails[gameId] || 0) + 1 };
 let msg = "";
 let next: GauntletState;

 if (s.penaltyMode === "stepback") {
 if (idx <= 0) {
 msg = `Défaite sur ${g?.name ?? "ce jeu"}. Tu es au jeu 1, impossible de reculer plus — réessaye !`;
 next = { ...s, attempt: s.attempt + 1, runFails };
 } else {
 const prevGameId = s.run[idx - 1];
 const prevG = POOL.find((x) => x.id === prevGameId);
 msg = `Défaite sur ${g?.name ?? "ce jeu"}. Tu recules d'un jeu : retour sur ${prevG?.name ?? "le jeu précédent"} (jeu #${idx}).`;
 next = {
 ...s,
 attempt: s.attempt + 1,
 current: idx - 1,
 done: s.done.filter((x) => x !== prevGameId),
 runFails,
 };
 }
 } else {
 // Reset complet — log this run as failed
 msg = `Défaite sur ${g?.name ?? "ce jeu"}. Tentative #${s.attempt + 1} — la run recommence depuis le jeu 1.`;
 const newHistory = logRunToHistory(s, "lose", gameId);
 next = {
 ...s,
 attempt: s.attempt + 1,
 current: 0,
 done: [],
 champions: {},
 runStartTime: Date.now(),
 runFails: {},
 history: newHistory,
 };
 }

 setOverlay({ kind: "lose", msg });
 return next;
 });
 shakeScreen();
 playLose();
 };

 const fullReset = () => {
 setState((s) => ({
 ...s,
 attempt: 1,
 current: 0,
 done: [],
 champions: {},
 run: [],
 runStartTime: null,
 runFails: {},
 }));
 };

 const hardReset = () => {
 if (!confirm("Reset complet ? Toute la progression et les épinglages seront effacés.")) return;
 setState((s) => ({
 ...DEFAULT_STATE,
 difficulty: s.difficulty,
 penaltyMode: s.penaltyMode,
 players: s.players,
 playerCount: s.playerCount,
 soundEnabled: s.soundEnabled,
 history: s.history,
 }));
 };

 // === STATS ===
 const computeStats = () => {
 const h = state.history || [];
 const total = h.length;
 const wins = h.filter((x) => x.outcome === "win").length;
 const successRate = total > 0 ? Math.round((wins / total) * 100) : 0;
 const totalDuration = h.reduce((acc, x) => acc + (x.duration || 0), 0);
 const avgAttempts =
 total > 0 ? (h.reduce((a, x) => a + (x.attempts || 1), 0) / total).toFixed(1) : "0";
 const failedCounts: Record<number, number> = {};
 h.filter((x) => x.outcome === "lose" && x.failedGameId).forEach((x) => {
 const id = x.failedGameId as number;
 failedCounts[id] = (failedCounts[id] || 0) + 1;
 });
 let mostFailedId: number | null = null;
 let mostFailedCount = 0;
 Object.entries(failedCounts).forEach(([id, c]) => {
 if (c > mostFailedCount) {
 mostFailedCount = c;
 mostFailedId = parseInt(id);
 }
 });
 const mostFailedGame = mostFailedId ? POOL.find((g) => g.id === mostFailedId) : null;
 const championCounts: Record<string, number> = {};
 h.forEach((x) => {
 Object.values(x.championPicks || {}).forEach((name) => {
 String(name).split(" & ").forEach((n) => {
 championCounts[n] = (championCounts[n] || 0) + 1;
 });
 });
 });
 let topChampion = "—";
 let topChampionCount = 0;
 Object.entries(championCounts).forEach(([name, c]) => {
 if (c > topChampionCount) {
 topChampionCount = c;
 topChampion = name;
 }
 });
 return { total, wins, successRate, totalDuration, avgAttempts, mostFailedGame, mostFailedCount, topChampion, topChampionCount };
 };

 // === DERIVED ===
 const filteredPool = POOL.filter(
 (g) =>
 (state.filter === "all" || g.cat === state.filter) &&
 (!state.search || g.name.toLowerCase().includes(state.search.toLowerCase()))
 );
 const progressPct = state.run.length === 0 ? 0 : (state.done.length / state.run.length) * 100;

 if (!hydrated) {
 return (
 <div className="container">
 <div className="hero">
 <h1>GAUNTLET CHALLENGE</h1>
 <div className="subtitle">Chargement…</div>
 </div>
 </div>
 );
 }

 const stats = computeStats();
 const totalSegs = state.run.length || 10;

 return (
 <>
 {/* Background particles */}
 <div id="bgParticles"ref={particlesRef}></div>
 {/* Confetti canvas */}
 <canvas id="confettiCanvas"ref={confettiRef}></canvas>
 {/* Sound toggle */}
 <button
 className={`sound-toggle ${state.soundEnabled ? "" : "muted"}`}
 title={state.soundEnabled ? "Couper le son" : "Activer le son"}
 onClick={() => {
 update({ soundEnabled: !state.soundEnabled });
 if (!state.soundEnabled) {
 initAudio();
 }
 }}
 >
 {state.soundEnabled ? <Icon name="volume" /> : <Icon name="volumeOff" />}
 </button>

 <div className="container">
 {/* HERO */}
 <div className="hero">
 <h1>GAUNTLET CHALLENGE</h1>
 <div className="subtitle">10 jeux · 0 défaite autorisée</div>
 <div className="lives">
            <span>#</span><span className="lives-num">{state.attempt}</span>
          </div>
          <div className="hero-meta">
            <span className={`hero-meta-pill ${state.difficulty}`}>
              <span className="dot"></span>
              {state.difficulty === "hardcore" ? "Hardcore" : "Normal"}
            </span>
            <span className="hero-meta-pill">
              <span className="dot"></span>
              {state.penaltyMode === "stepback" ? "Recule d'un jeu" : "Reset complet"}
            </span>
            <span className="hero-meta-pill">
              <span className="dot"></span>
              {state.playerCount} joueurs
            </span>
            {state.runStartTime && state.run.length > 0 && (
              <span className="hero-meta-pill timer">
                <span className="dot"></span>
                {fmtDuration(elapsed)}
              </span>
            )}
          </div>
 </div>

 {/* CONFIG */}
 <div className="panel">
 <h2><span className="panel-title"><span className="panel-section-num">1</span> Configuration</span></h2>
 <div className="setup-grid">
 {[0, 1, 2].map((i) => (
 <div className="field"key={i}>
 <label>Joueur {i + 1}</label>
 <input
 type="text"
 value={state.players[i] ?? ""}
 placeholder="Pseudo"
 onChange={(e) => {
 const next = [...state.players];
 next[i] = e.target.value;
 update({ players: next });
 }}
 />
 </div>
 ))}
 <div className="field">
 <label>Nombre de joueurs</label>
 <select
 value={state.playerCount}
 onChange={(e) => update({ playerCount: parseInt(e.target.value) })}
 >
 <option value={2}>2 joueurs</option>
 <option value={3}>3 joueurs</option>
 </select>
 </div>
 </div>

 <div className="field"style={{ marginTop: 18 }}>
 <label>Difficulté</label>
 <div className="toggle-group">
 <button
 className={`toggle ${state.difficulty === "normal" ? "active" : ""}`}
 onClick={() => update({ difficulty: "normal"as Difficulty })}
 >
 Normal
 </button>
 <button
 className={`toggle hardcore ${state.difficulty === "hardcore" ? "active" : ""}`}
 onClick={() => update({ difficulty: "hardcore"as Difficulty })}
 >
 Hardcore
 </button>
 </div>
 </div>

 <div className="field"style={{ marginTop: 18 }}>
 <label>Pénalité en cas de défaite</label>
 <div className="toggle-group">
 <button
 className={`toggle ${state.penaltyMode === "reset" ? "active" : ""}`}
 onClick={() => update({ penaltyMode: "reset"as PenaltyMode })}
 >
 Reset complet (retour jeu 1)
 </button>
 <button
 className={`toggle ${state.penaltyMode === "stepback" ? "active" : ""}`}
 onClick={() => update({ penaltyMode: "stepback"as PenaltyMode })}
 >
 Recule d&apos;un jeu
 </button>
 </div>
 </div>
 </div>

 {/* POOL */}
 <div className="panel">
 <h2><span className="panel-title"><span className="panel-section-num">2</span> Sélection du pool</span><span className="badge">{state.pinned.length} / 5 épinglés</span>
 </h2>
 <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>
 Clique pour <strong style={{ color: "var(--gold)" }}>épingler jusqu&apos;à 5 jeux</strong> qui seront forcés dans la run. Les autres sont tirés au sort dans le reste du pool.
 </p>
 <div className="pool-controls">
 <input
 type="text"
 className="pool-search"
 placeholder="Chercher un jeu..."
 value={state.search}
 onChange={(e) => update({ search: e.target.value })}
 />
 </div>
 <div className="filter-pills">
 {getCategories().map((cat) => (
 <button
 key={cat}
 className={`filter-pill ${state.filter === cat ? "active" : ""}`}
 onClick={() => update({ filter: cat })}
 >
 {cat === "all" ? "Toutes" : `${CAT_ICONS[cat] ?? ""} ${cat}`}
 </button>
 ))}
 </div>
 <div className="mode-legend">
            <span className="mode-legend-item"><span className="dot solo"></span> Solo Champion</span>
            <span className="mode-legend-item"><span className="dot duo"></span> Duo</span>
            <span className="mode-legend-item"><span className="dot team"></span> Team (3 joueurs)</span>
          </div>
          <div className="pool-grid">
 {filteredPool.map((g) => {
 const effMode = effectiveMode(g, state.difficulty);
 const isPinned = state.pinned.includes(g.id);
 const modeLabelText = effMode === "solo" ? "Solo" : effMode === "duo" ? "Duo" : "Team";
              let modeLabel = modeLabelText;
 if (g.soloHardcore && state.difficulty !== "hardcore") modeLabel += " (HC = Solo)";
 return (
 <div
 key={g.id}
 className={`pool-card ${effMode === "solo" ? "solo" : effMode === "duo" ? "duo" : "team"} ${isPinned ? "pinned" : ""}`}
 onClick={() => togglePin(g.id)}
 >
 <span className="pool-card-pin"><Icon name="pin" size={12} /></span>
                  <GameCover appid={g.appid} name={g.name} size="sm" />
                  <div className="pool-card-info">
                    <div className="pool-card-name">{g.name}</div>
                    <div className="pool-card-meta">{g.cat}</div>
                    <div className="pool-card-mode">{effMode === "solo" ? <Icon name="star" size={11} /> : effMode === "duo" ? <Icon name="user" size={11} /> : <Icon name="users" size={11} />} {modeLabel}</div>
                  </div>
 </div>
 );
 })}
 </div>
 <div className="generate-row">
 <button className="btn btn-large btn-start"onClick={generateRun}>
 {state.run.length > 0 ? <><Icon name="sparkles" /> Régénérer une nouvelle run</> : <><Icon name="sparkles" /> Générer la run (10 jeux)</>}
 </button>
 <button className="btn btn-large btn-reroll"onClick={rerollRun} disabled={state.run.length === 0}>
 <><Icon name="refresh" /> Re-roll les jeux aléatoires</>
 </button>
 </div>
 </div>

 {/* RUN */}
 <div className="panel"id="runPanel">
 <h2><span className="panel-title"><span className="panel-section-num">3</span> Run en cours</span>{state.run.length > 0 && (
 <span className="badge">
 {state.done.length}/{state.run.length}
 </span>
 )}
 </h2>
 <div className="progress-wrap">
 <div className="progress-info">
 <span>{state.difficulty === "hardcore" ? "Mode Hardcore" : "Mode Normal"}</span>
 <span>{state.done.length} / {totalSegs}</span>
 </div>
 <div className="progress-bar">
 <div
 className={`progress-fill ${state.difficulty === "hardcore" ? "hardcore" : ""}`}
 style={{ width: `${progressPct}%` }}
 />
 </div>
 <div className={`seg-progress ${state.difficulty === "hardcore" ? "hardcore" : ""}`}>
 {Array.from({ length: totalSegs }).map((_, i) => {
 let cls = "seg";
 if (i < state.done.length) cls += "done";
 else if (i === state.current && state.run.length > 0) cls += "current";
 return <div key={i} className={cls}></div>;
 })}
 </div>
 </div>

 {state.run.length === 0 ? (
 <div className="empty-run">
 <h3>Aucune run générée</h3>
 <p>
 Épingle 0 à 5 jeux ci-dessus puis clique sur <strong>Générer la run</strong>.
 </p>
 </div>
) : (
 <div className="games"id="gamesList">
 {state.run.map((gameId, idx) => {
 const g = POOL.find((x) => x.id === gameId) as Game | undefined;
 if (!g) return null;
 const isDone = state.done.includes(gameId);
 const isCurrent = idx === state.current && !isDone;
 const isLocked = idx > state.current && !isDone;
 const effMode = effectiveMode(g, state.difficulty);
 const isSolo = effMode === "solo" || effMode === "duo";
 const isPinned = state.pinned.includes(gameId);
 const objective = state.difficulty === "hardcore" ? g.hardcore : g.normal;
 const champion = state.champions[gameId];
 const isDrawing = drawingFor === gameId && slotData;

 const classes = [
 "game",
 "tiltable",
 isLocked ? "locked" : "",
 isCurrent ? "current" : "",
 isDone ? "done" : "",
 isPinned ? "pinned-run" : "",
 swappedIdx === idx ? "swapped" : "",
 ]
 .filter(Boolean)
 .join(" ");

 const modeTagClass = effMode === "solo" ? "solo" : effMode === "duo" ? "duo" : "team";
 const modeIcon = effMode === "solo" ? "star" : effMode === "duo" ? "user" : "users";
 const modeTagText = g.cat;

 return (
 <div key={`${gameId}-${idx}`} className={classes}>
 <div className="game-num">{String(idx + 1).padStart(2, "0")}</div>
 <GameCover appid={g.appid} name={g.name} size="md" />
 <div className="game-info">
 <div className="game-title-row">
 <div className="game-title">
 {CAT_ICONS[g.cat] ?? ""} {g.name}
 </div>
 <div className={`game-tag ${modeTagClass}`}><Icon name={modeIcon} size={11} /> {modeTagText}</div>
 {isPinned && <div className="game-tag pinned-tag"><Icon name="pin" size={11} /> Épinglé</div>}
 </div>
 <div className={`game-objective ${state.difficulty === "hardcore" ? "hc" : ""}`}>
 Objectif : <strong>{objective}</strong>
 </div>
 {isSolo && (
 <div className="game-champion">
 {isDrawing && slotData ? (
 <>
 Tirage en cours...
 <div className={`slot-machine ${slotData.locked.every(Boolean) ? "locked" : ""}`}>
 {slotData.reels.map((cells, r) => (
 <div className="slot-reel"key={r}>
 <div className="slot-strip"id={`strip${r}`}>
 {cells.map((c, ci) => (
 <div className="slot-cell"key={ci}>
 {c}
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 </>
) : champion ? (
 effMode === "duo" ? (
 <>Duo désigné : <span className="name">{champion}</span></>
) : (
 <>Champion désigné : <span className="name">{champion}</span></>
 )
) : effMode === "duo" ? (
 <>Aucun duo tiré — <em>Tirage au sort requis</em></>
) : (
 <>Aucun champion tiré — <em>Tirage au sort requis</em></>
 )}
 </div>
 )}
 </div>
 <div className="game-actions">
 {isDone ? (
 <div className="check"></div>
) : (
 <>
 <button
 className="btn btn-swap"
 onClick={() => swapGame(gameId)}
 title="On n'a pas ce jeu / on veut le remplacer"
 >
 Swap
 </button>
 {isSolo && (
 <button
 className="btn btn-draw"
 disabled={!isCurrent}
 onClick={() => drawChampion(gameId, effMode as "solo" | "duo")}
 >
 Tirer
 </button>
 )}
 <button className="btn btn-win"disabled={!isCurrent} onClick={() => winGame(gameId)}>
 Validé
 </button>
 <button className="btn btn-lose"disabled={!isCurrent} onClick={() => loseGame(gameId)}>
 Échoué
 </button>
 </>
 )}
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>

 {/* STATS / HISTORY */}
 <div className="panel">
 <h2>
 Stats &amp; Historique
 <button
 className="stats-toggle-btn"
 style={{ margin: "0 0 0 auto" }}
 onClick={() => update({ showHistory: !state.showHistory })}
 >
 {state.showHistory ? <><Icon name="eyeOff" size={12} /> Masquer l'historique</> : <><Icon name="eye" size={12} /> Afficher l'historique</>}
 </button>
 </h2>
 <div className="stats-grid">
 {[
 { value: stats.total, label: "Runs lancées" },
 { value: stats.wins, label: "Runs réussies" },
 { value: stats.successRate + "%", label: "Taux de réussite" },
 { value: stats.avgAttempts, label: "Tentatives moy." },
 { value: fmtDuration(stats.totalDuration), label: "Temps total joué" },
 {
 value: stats.mostFailedGame ? stats.mostFailedGame.name : "—",
 label: `Jeu le + raté${stats.mostFailedCount ? " (×" + stats.mostFailedCount + ")" : ""}`,
 },
 {
 value: stats.topChampion,
 label: `Champion le + tiré${stats.topChampionCount ? " (×" + stats.topChampionCount + ")" : ""}`,
 },
 ].map((s, i) => (
 <div className="stat"key={i}>
 <div className="stat-value">{s.value}</div>
 <div className="stat-label">{s.label}</div>
 </div>
 ))}
 </div>
 {state.showHistory && (
 <div className="history-list">
 {state.history.length === 0 ? (
 <div className="history-empty">Aucune run terminée. Lance une run pour commencer !</div>
) : (
 state.history.map((entry) => {
 const failed = entry.failedGameId ? POOL.find((g) => g.id === entry.failedGameId) : null;
 const tag = entry.outcome === "win" ? "" : "";
 const status = entry.outcome === "win" ? "GAUNTLET WIN" : "Failed";
 return (
 <div
 key={entry.id}
 className={`history-item ${entry.outcome === "win" ? "win" : "lose"}`}
 >
 <div className="history-item-icon">{tag}</div>
 <div>
 <strong>{status}</strong>
 <div className="history-item-meta">
 {fmtDate(entry.ts)} · {entry.completed || 0}/{entry.total || 10} jeux
 {failed && (
 <>
 {" · raté sur "}<strong>{failed.name}</strong>
 </>
 )}
 {" · "}{entry.difficulty === "hardcore" ? "HC" : "N"}
 </div>
 </div>
 <div className="history-item-meta">
 <strong>{entry.attempts}</strong> tentatives
 <br />
 {fmtDuration(entry.duration)}
 </div>
 </div>
 );
 })
 )}
 </div>
 )}
 </div>

 {/* GLOBAL CONTROLS */}
 <div className="controls">
 <button className="btn btn-large btn-reset"onClick={hardReset}>
 Reset complet
 </button>
 </div>

 {/* RULES */}
 <div className="rules">
 <strong> Règles du Gauntlet</strong>
 <ul>
 <li>
 Vous devez réussir l&apos;objectif des <strong>10 jeux dans l&apos;ordre</strong> sans une seule défaite.
 </li>
 <li>
 Si l&apos;objectif d&apos;un jeu n&apos;est pas atteint, deux pénalités au choix dans la config :{" "}
 <strong>Reset complet</strong> (retour jeu 1) ou <strong>Recule d&apos;un jeu</strong>.
 </li>
 <li>
 Les jeux marqués <span style={{ color: "var(--gold)", fontWeight: 700 }}>SOLO</span> doivent être réussis par <strong>un seul joueur tiré au sort</strong>.
 </li>
 <li>
 Les jeux marqués <span style={{ color: "var(--accent-2)", fontWeight: 700 }}>DUO</span> doivent être réussis par <strong>2 joueurs tirés au sort</strong>.
 </li>
 <li>
 Mode <strong>Hardcore</strong> : objectifs nettement plus exigeants.
 </li>
 <li>Bouton Swap par carte : remplace un seul jeu par un autre tiré au sort dans le pool restant.</li>
 <li>La progression et l&apos;historique sont sauvegardés automatiquement dans ce navigateur.</li>
 </ul>
 </div>

 {/* OVERLAYS */}
 {overlay.kind === "win" && (
 <div className="overlay win">
 <div className="overlay-content">
 <h2> GAUNTLET COMPLETED </h2>
 <p>Vous avez vaincu les 10 épreuves sans une seule défaite. Le panthéon vous attend.</p>
 <button
 className="btn btn-large btn-win"
 onClick={() => {
 setOverlay({ kind: null });
 fullReset();
 }}
 >
 Recommencer une run
 </button>
 </div>
 </div>
 )}

 {overlay.kind === "lose" && (
 <div className="overlay lose">
 <div className="overlay-content">
 <h2>GAUNTLET FAILED </h2>
 <p>{overlay.msg}</p>
 <button className="btn btn-large btn-lose"onClick={() => setOverlay({ kind: null })}>
 Repartir au combat
 </button>
 </div>
 </div>
 )}

 {/* === PRE-RUN REVIEW MODAL === */}
 {reviewing && pendingRun && (
 <div className="overlay show">
 <div className="overlay-content review-content">
 <h2>Préparation de la run</h2>
 <p>Vérifie que tous les jeux sont installés. Tu peux ouvrir Steam pour télécharger ce qui te manque, ou remplacer un jeu qui ne convient pas.</p>
 <div className="review-list">
 {pendingRun.map((id, idx) => {
 const g = POOL.find((x) => x.id === id);
 if (!g) return null;
 const effMode = effectiveMode(g, state.difficulty);
 const modeLabel = effMode === "solo" ? "Solo" : effMode === "duo" ? "Duo" : "Team";
 const modeIconName = effMode === "solo" ? "star" : effMode === "duo" ? "user" : "users";
 const obj = state.difficulty === "hardcore" ? g.hardcore : g.normal;
 return (
 <div className="review-item" key={`${id}-${idx}`}>
 <div className="review-num">{String(idx + 1).padStart(2, "0")}</div>
 <GameCover appid={g.appid} name={g.name} size="sm" />
 <div className="review-info">
 <div className="review-name">{g.name}</div>
 <div className="review-meta">
 <span className={`game-tag ${effMode === "solo" ? "solo" : effMode === "duo" ? "duo" : "team"}`}>
 <Icon name={modeIconName} size={11} /> {modeLabel}
 </span>
 <span className="review-objective">{obj}</span>
 </div>
 </div>
 <a href={steamSearchUrl(g.name)} target="_blank" rel="noopener noreferrer" className="btn btn-steam" title="Ouvrir Steam pour télécharger">
 Steam
 </a>
 <button className="btn btn-swap" onClick={() => swapInPending(id)}>
 <Icon name="refresh" /> Remplacer
 </button>
 </div>
 );
 })}
 </div>
 <div className="review-actions">
 <button className="btn btn-large btn-reset" onClick={cancelReview}>Annuler</button>
 <button className="btn btn-large btn-start" onClick={confirmRun}>
 <Icon name="sparkles" /> Tout est prêt — Lancer
 </button>
 </div>
 </div>
 </div>
 )}

 {/* === COUNTDOWN OVERLAY === */}
 {countdown !== null && (
 <div className="overlay show countdown-overlay">
 <div className="countdown-display">
 {countdown > 0 ? countdown : "GO"}
 </div>
 </div>
 )}
 </div>
 </>
 );
}
