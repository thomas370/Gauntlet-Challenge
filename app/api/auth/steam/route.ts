import { NextResponse, type NextRequest } from "next/server";
import { buildLoginUrl } from "@/lib/server/openid";

export async function GET(req: NextRequest) {
  const pair = req.nextUrl.searchParams.get("pair") ?? undefined;
  return NextResponse.redirect(buildLoginUrl(pair));
}
