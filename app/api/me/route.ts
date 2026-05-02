import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/server/auth";

export async function GET() {
  const user = getSessionFromCookies();
  if (!user) return NextResponse.json(null);
  return NextResponse.json(user);
}
