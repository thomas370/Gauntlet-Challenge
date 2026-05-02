// App-wide auth gate. Anything that isn't /login, /pair, or an /api/auth/* route
// is locked behind a valid Steam session cookie.

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth";

const PUBLIC_PATHS = ["/login", "/pair"];
const PUBLIC_API_PREFIXES = ["/api/auth/"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const hasSession = req.cookies.has(SESSION_COOKIE);
  if (!hasSession) {
    // For API requests, return 401 instead of redirecting so callers see the failure.
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
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon|covers/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
