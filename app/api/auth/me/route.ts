import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionCookieAttrs, verifySession } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? verifySession(token) : null;
  if (!user) {
    const res = NextResponse.json({ user: null }, { status: 200 });
    // If a cookie was present but didn't verify (rotated JWT_SECRET, expired
    // token, etc.), clear it. Otherwise the middleware sees `cookies.has(...)`
    // return true and keeps bouncing the user back to /lobby — infinite loop.
    if (token) {
      res.cookies.set({ ...sessionCookieAttrs(), name: SESSION_COOKIE, value: "", maxAge: 0 });
    }
    return res;
  }
  return NextResponse.json({ user });
}
