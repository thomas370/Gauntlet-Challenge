// Les mutations d'état passent maintenant par Socket.io (event "mutate" dans server.ts).
// Cette route REST est conservée pour compatibilité mais retourne 410 Gone.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Deprecated — use Socket.io 'mutate' event instead" },
    { status: 410 },
  );
}
