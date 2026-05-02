import { NextResponse } from "next/server";
import { peekCode } from "@/lib/server/pair-store";

export async function GET(
  _req: Request,
  { params }: { params: { code: string } },
) {
  const status = peekCode(params.code.toUpperCase());
  if (!status.exists) {
    return NextResponse.json({ exists: false }, { status: 404 });
  }
  return NextResponse.json(status);
}
