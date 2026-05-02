// GET /api/room/[code]/stream — Server-Sent Events stream for a room.
// On connect: emits a `state` and a `members` event with the current snapshot.
// Subsequent room mutations are broadcast through the same stream.
//
// IMPORTANT: this needs a long-running Node host. Vercel/Netlify serverless
// will kill the connection after 30–60s.

import { type NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/server/auth";
import { joinRoom, subscribe } from "@/lib/server/room-store";
import type { RoomEvent } from "@/lib/types/room";

export const dynamic = "force-dynamic";
// Use the Node runtime explicitly — the Edge runtime has tighter limits on streams.
export const runtime = "nodejs";

function format(event: RoomEvent): string {
  // SSE wire format: `event: <name>\ndata: <json>\n\n`
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } },
) {
  const user = getSessionFromRequest(req);
  if (!user) return new Response("unauthorized", { status: 401 });

  // Implicit join — opening the stream means the user is in the room. This makes
  // the SSE connection itself the join signal, so refreshing the page Just Works.
  const joined = joinRoom(params.code, user);
  if ("error" in joined) {
    // Send a proper SSE `closed` event so the client hook picks it up and
    // redirects to the lobby, instead of a bare 404 that EventSource retries forever.
    const enc = new TextEncoder();
    const msg = `event: closed\ndata: ${JSON.stringify({ type: "closed", reason: joined.error })}\n\n`;
    return new Response(
      new ReadableStream({ start(c) { c.enqueue(enc.encode(msg)); c.close(); } }),
      { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } },
    );
  }

  const encoder = new TextEncoder();
  let unsub: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: RoomEvent) => {
        try {
          controller.enqueue(encoder.encode(format(event)));
        } catch {
          // Controller closed (client disconnected) — let subscribe-side cleanup handle it.
        }
      };

      const result = subscribe(params.code, user.steamId, send);
      if ("error" in result) {
        controller.enqueue(encoder.encode(format({ type: "closed", reason: result.error })));
        controller.close();
        return;
      }
      unsub = result.unsubscribe;

      // Initial snapshot — clients use this to populate before any mutation arrives.
      send({ type: "state", state: result.snapshot.state });
      send({ type: "members", members: result.snapshot.members });

      // Heartbeat every 25s to keep proxies/load-balancers from idling out the connection.
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25_000);

      // Tear down on client disconnect.
      const onAbort = () => {
        clearInterval(heartbeat);
        unsub?.();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      req.signal.addEventListener("abort", onAbort);
    },
    cancel() {
      unsub?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
