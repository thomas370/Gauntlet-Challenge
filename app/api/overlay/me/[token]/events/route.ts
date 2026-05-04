// GET /api/overlay/me/[token]/events
//
// Stable per-user SSE feed for Twitch overlays. The token resolves to a Steam
// ID; we stream the overlay state of whatever room that user is currently in,
// auto-hopping when they join/leave rooms. OBS browser-source URLs only need
// to be set up once.
//
// While the user isn't in any room we still hold the connection open and emit
// a "noroom" placeholder so the widgets render in their idle state instead of
// looking broken.

import type { NextRequest } from "next/server";
import { subscribeUserOverlay } from "@/lib/server/room-store";
import { verifyOverlayToken } from "@/lib/server/overlay-token";
import type { OverlayState } from "@/lib/server/overlay-state";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const NOROOM_PLACEHOLDER: OverlayState = {
  totalElapsed: 0,
  startedAt: null,
  victories: 0,
  goal: 10,
  resets: 0,
  currentGameId: null,
  currentGameStartedAt: null,
  currentGameElapsed: 0,
  games: [],
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function GET(
  req: NextRequest,
  { params }: { params: { token: string } },
) {
  const verified = verifyOverlayToken(params.token);
  if (!verified) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ error: "Invalid token" })}\n\n`,
      {
        status: 401,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      },
    );
  }

  const encoder = new TextEncoder();

  let unsubscribe: (() => void) | null = null;
  let keepAlive: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (overlay: OverlayState | null) => {
        const payload = overlay ?? NOROOM_PLACEHOLDER;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const result = subscribeUserOverlay(verified.steamId, send);
      unsubscribe = result.unsubscribe;

      controller.enqueue(encoder.encode(`retry: 1500\n\n`));
      send(result.snapshot);

      keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ka\n\n`));
        } catch {
          // Stream closed underneath us.
        }
      }, 15_000);

      req.signal.addEventListener("abort", () => {
        if (keepAlive) clearInterval(keepAlive);
        unsubscribe?.();
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      });
    },
    cancel() {
      if (keepAlive) clearInterval(keepAlive);
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
