function liveTotalMs(s) {
  if (!s) return 0;
  let ms = s.totalElapsed || 0;
  if (s.startedAt) ms += Date.now() - s.startedAt;
  return ms;
}

function liveCurrentMs(s) {
  if (!s) return 0;
  let ms = s.currentGameElapsed || 0;
  if (s.currentGameStartedAt) ms += Date.now() - s.currentGameStartedAt;
  return ms;
}

function fmtHMS(ms) {
  if (ms < 0) ms = 0;
  const t = Math.floor(ms / 1000);
  const h = String(Math.floor(t / 3600)).padStart(2, '0');
  const m = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
  const s = String(t % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function fmtMS(seconds) {
  if (!seconds || seconds <= 0) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

window.liveTotalMs = liveTotalMs;
window.liveCurrentMs = liveCurrentMs;
window.fmtHMS = fmtHMS;
window.fmtMS = fmtMS;
