// This SSE endpoint has been replaced by Socket.io (server.ts).
// Kept as a stub so Next.js doesn't throw on stale imports.
export const dynamic = "force-dynamic";
export async function GET() {
  return new Response("SSE replaced by WebSocket — connect via Socket.io", { status: 410 });
}
