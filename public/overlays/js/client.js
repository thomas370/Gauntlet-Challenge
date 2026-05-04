// Twitch overlay client.
//
// Subscribes to one of the SSE feeds and fans out updates to widget renderers
// registered via window.Overlay.subscribe().
//
// Three connection modes, picked by URL params:
//
//   ?token=<jwt>   → /api/overlay/me/<token>/events
//                    Stable per-user feed, auto-hops with whichever room you
//                    join. Recommended for OBS — set up once, reuse forever.
//
//   ?room=<code>   → /api/overlay/<code>/events
//                    Pinned to a specific room code. Breaks when the room
//                    expires; only useful for one-off scenes.
//
//   (none)         → /api/events
//                    Legacy local control-panel server, kept for the original
//                    standalone overlay-server folder.
//
// `?server=<origin>` is optional with token/room: forces cross-origin SSE
// against a different host. Same-origin by default.

(function () {
  let state = null;
  const listeners = new Set();

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const room = params.get('room');
  const server = (params.get('server') || '').replace(/\/$/, '');

  let eventsUrl;
  if (token) {
    eventsUrl = `${server}/api/overlay/me/${encodeURIComponent(token)}/events`;
  } else if (room) {
    eventsUrl = `${server}/api/overlay/${encodeURIComponent(room)}/events`;
  } else {
    eventsUrl = '/api/events';
  }

  function connect() {
    const es = new EventSource(eventsUrl);
    es.onmessage = (e) => {
      try {
        state = JSON.parse(e.data);
        listeners.forEach(fn => { try { fn(state); } catch (err) { console.error(err); } });
      } catch {}
    };
    es.addEventListener('error', (e) => {
      if (e && e.data) {
        try { console.warn('[overlay] server error:', JSON.parse(e.data)); } catch {}
      }
    });
    es.onerror = () => {
      es.close();
      setTimeout(connect, 1500);
    };
  }

  // Bridged mode is read-only — mutations come from the Gauntlet UI, not the
  // overlay. Kept for backward compat with the legacy local control panel.
  async function dispatch(action) {
    if (token || room) {
      console.warn('[overlay] dispatch ignored in bridged mode');
      return;
    }
    try {
      await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      });
    } catch (e) {
      console.error('dispatch failed', e);
    }
  }

  connect();

  window.Overlay = {
    subscribe(fn) { listeners.add(fn); if (state) fn(state); return () => listeners.delete(fn); },
    get state() { return state; },
    dispatch,
    bridged: Boolean(token || room),
  };
})();
