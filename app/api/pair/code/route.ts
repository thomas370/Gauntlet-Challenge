import { NextResponse } from "next/server";
import { createCode } from "@/lib/server/pair-store";

export async function POST() {
  const { code, expiresInSec } = createCode();
  return NextResponse.json({ code, expiresInSec });
}
