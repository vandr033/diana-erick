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
  const [existing] = await db.select({ party: rsvpResponses.party }).from(rsvpResponses).where(eq(rsvpResponses.id, id)).limit(1);
  if (!existing) return NextResponse.json({ message: "No se encontró la respuesta solicitada." }, { status: 404 });
  const { fullName, comment, saturdayAttendance } = parsed.data;
  let { attendsFriday, attendsSaturday, attendsSunday } = parsed.data;
  const party = existing.party;
  if (party?.saturdayAttendance) {
    if (saturdayAttendance?.length !== party.companions.length + 1) {
      return NextResponse.json({ message: "Indica si asistirá cada persona." }, { status: 422 });
    }
    party.saturdayAttendance = saturdayAttendance;
    attendsFriday = attendsSunday = "no";
    attendsSaturday = saturdayAttendance.includes("yes") ? "yes" : "no";
  } else if (party && [attendsFriday, attendsSaturday, attendsSunday].includes("maybe")) {
    return NextResponse.json({ message: "Elige sí o no para confirmar la asistencia del grupo." }, { status: 422 });
  }
  const result = await db.update(rsvpResponses).set({ fullName, attendsFriday, attendsSaturday, attendsSunday, party, comment: comment?.trim() || null, updatedAt: new Date() }).where(eq(rsvpResponses.id, id)).returning({ id: rsvpResponses.id });
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
