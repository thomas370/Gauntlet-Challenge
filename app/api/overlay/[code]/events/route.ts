// GET /api/overlay/[code]/events
//
// Public, read-only SSE feed for Twitch overlays. Knowing the room code is
// enough; this stream is meant to be wired into OBS browser sources, so
// requiring Steam auth would defeat the purpose. CORS is open so the overlay
// HTML can be served from a different origin (e.g. the standalone overlay
// server on :3030, or directly via file:// during testing).

import type { NextRequest } from "next/server";
import { subscribeOverlay } from "@/lib/server/room-store";
import type { OverlayState } from "@/lib/server/overlay-state";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function GET(
  req: NextRequest,
  { params }: { params: { code: string } },
) {
  const encoder = new TextEncoder();

  let unsubscribe: (() => void) | null = null;
  let keepAlive: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (state: OverlayState) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(state)}\n\n`));
      };

      const result = subscribeOverlay(params.code, send);
      if ("error" in result) {
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ error: result.error })}\n\n`),
        );
        controller.close();
        return;
      }

      unsubscribe = result.unsubscribe;

      // Initial snapshot — same format as a regular update.
      controller.enqueue(encoder.encode(`retry: 1500\n\n`));
      send(result.snapshot);

      // Keep-alive comment every 15s — proxies (nginx, cloudflare) drop idle
      // streams otherwise.
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
