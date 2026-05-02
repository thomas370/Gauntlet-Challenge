import { NextResponse } from "next/server";
import { consumeCode } from "@/lib/server/pair-store";

export async function POST(
  _req: Request,
  { params }: { params: { code: string } },
) {
  const user = consumeCode(params.code.toUpperCase());
  if (!user) return NextResponse.json({ user: null }, { status: 404 });
  return NextResponse.json({ user });
}
