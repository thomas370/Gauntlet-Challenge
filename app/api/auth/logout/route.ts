import { NextResponse } from "next/server";
import { sessionCookieAttrs, SESSION_COOKIE } from "@/lib/server/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ ...sessionCookieAttrs(), name: SESSION_COOKIE, value: "", maxAge: 0 });
  return res;
}
