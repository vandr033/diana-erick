import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { rsvpResponses } from "@/src/db/schema";
import { requireAdminApi } from "@/src/lib/auth";
import { responseAdminSchema } from "@/src/lib/validation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApi()) return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  const { id } = await params;
  const parsed = responseAdminSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message || "Revisa los campos." }, { status: 400 });
  const result = await db.update(rsvpResponses).set({ fullName: parsed.data.fullName, attendsFriday: parsed.data.attendsFriday, attendsSaturday: parsed.data.attendsSaturday, attendsSunday: parsed.data.attendsSunday, comment: parsed.data.comment?.trim() || null, updatedAt: new Date() }).where(eq(rsvpResponses.id, id)).returning({ id: rsvpResponses.id });
  if (!result[0]) return NextResponse.json({ message: "No se encontró la respuesta solicitada." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApi()) return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  const { id } = await params;
  const result = await db.delete(rsvpResponses).where(eq(rsvpResponses.id, id)).returning({ id: rsvpResponses.id });
  if (!result[0]) return NextResponse.json({ message: "No se encontró la respuesta solicitada." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
