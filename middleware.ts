// App-wide auth gate. Anything that isn't /login, /pair, or an /api/auth/* route
// is locked behind a valid Steam session cookie.

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-cookie";

// Paths accessible without auth
// /api/overlay/ is the read-only SSE feed for Twitch overlays. OBS browser
// sources can't send the Steam session cookie, so the room code embedded in
// the URL is the only access control needed.
const PUBLIC_API_PREFIXES = ["/api/auth/", "/socket.io/", "/api/overlay/"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public API routes (Steam OAuth callbacks, Socket.io transport, etc.)
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const hasSession = req.cookies.has(SESSION_COOKIE);

  // Logged-in users trying to access /login or / → redirect to lobby
  if (hasSession && (pathname === "/" || pathname === "/login")) {
    const url = req.nextUrl.clone();
    url.pathname = "/lobby";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // /login and /pair are public (allow unauthenticated access)
  if (pathname === "/login" || pathname.startsWith("/pair")) {
    return NextResponse.next();
  }

  // Everything else requires a session
  if (!hasSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Skip static assets so they don't trigger the auth check on every load.
// `overlays/` is the Twitch overlay bundle — public on purpose, since OBS
// browser sources don't carry the Steam session cookie. Read-only access is
// gated by the room code embedded in the URL (`?room=...`).
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon|covers/|overlays/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
