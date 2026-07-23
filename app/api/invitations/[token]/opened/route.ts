import { NextResponse } from "next/server";
import { markInvitationOpened } from "@/src/lib/whatsapp";

export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await markInvitationOpened(token);
  return NextResponse.json({ ok: true });
}
