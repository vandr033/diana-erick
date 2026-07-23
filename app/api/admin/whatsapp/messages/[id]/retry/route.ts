import { NextResponse } from "next/server";
import { requireAdminApi } from "@/src/lib/auth";
import { requeueWhatsappMessage } from "@/src/lib/whatsapp";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApi()) return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  const { id } = await params;
  if (!await requeueWhatsappMessage(id)) return NextResponse.json({ message: "No se encontró el mensaje." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
