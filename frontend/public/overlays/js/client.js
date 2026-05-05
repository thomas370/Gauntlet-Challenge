// Twitch overlay client.
//
// Subscribes to one of the SSE feeds and fans out updates to widget renderers
// registered via window.Overlay.subscribe().
//
// Deux modes de connexion, choisis via les params d'URL :
//
//   ?token=<jwt>   → /api/overlay/me/<token>/events
//                    Flux stable lié à l'utilisateur, auto-hop entre les rooms.
//                    Recommandé pour OBS — set up once, reuse forever.
//
//   ?room=<code>   → /api/overlay/<code>/events
//                    Lié à un code de room. Coupe quand la room expire.
//
// `?server=<origin>` est optionnel : forçe le SSE vers un autre host (cross-origin).
// Inutile en deploy unifié (Express sert l'overlay et l'API au même origin).

(function () {
  let state = null;
  const listeners = new Set();

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const room = params.get('room');
  const server = (params.get('server') || '').replace(/\/$/, '');

  if (!token && !room) {
    console.error('[overlay] missing ?token=<jwt> ou ?room=<code> dans l\'URL');
    return;
  }

  const eventsUrl = token
    ? `${server}/api/overlay/me/${encodeURIComponent(token)}/events`
    : `${server}/api/overlay/${encodeURIComponent(room)}/events`;

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

  connect();

  window.Overlay = {
    subscribe(fn) { listeners.add(fn); if (state) fn(state); return () => listeners.delete(fn); },
    get state() { return state; },
    bridged: true,
  };
})();
