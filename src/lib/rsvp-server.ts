import { NextResponse } from "next/server";
import { db } from "@/src/db/client";
import { getEvents, getSettings } from "@/src/db/queries";
import { rsvpResponses, type PartyResponse } from "@/src/db/schema";
import { getInvitationGuest } from "@/src/lib/invitation-guests";
import { rsvpSchema, saturdayAttendanceSchema } from "@/src/lib/validation";
import { newId } from "@/src/lib/utils";

export async function handleRsvpSubmission(request: Request, scope: "all" | "saturday") {
  try {
    const body = await request.json() as Record<string, unknown>;
    if (body.honeypot) return NextResponse.json({ ok: true, confirmation: body }, { status: 201 });
    const phase = body.phase === "final" ? "final" : "save-the-date";
    const invitationGuest = typeof body.invitationToken === "string" ? await getInvitationGuest(body.invitationToken, phase) : null;
    if (phase === "final" && body.invitationToken !== undefined && !invitationGuest) {
      return NextResponse.json({ message: "No encontramos esta invitación." }, { status: 404 });
    }
    const saturdayOnly = phase === "final" && invitationGuest ? invitationGuest.saturdayOnly : scope === "saturday";
    let party: PartyResponse | null = null;
    if (phase === "final") {
      const [settings, events] = await Promise.all([getSettings(), getEvents(true)]);
      if (!settings.rsvpEnabled) return NextResponse.json({ message: settings.rsvpClosedMessage }, { status: 403 });
      const companions = invitationGuest?.companions ?? [];
      if (companions.length || body.companions !== undefined) {
        const submitted = body.companions;
        if (!Array.isArray(submitted) || submitted.length !== companions.length || companions.some((name, index) => name !== submitted[index])) {
          return NextResponse.json({ message: "Tu lista de invitados cambió. Vuelve a abrir la invitación para confirmar." }, { status: 409 });
        }
      }
      if (companions.length) party = { companions };
      if (party && saturdayOnly) {
        const answers = saturdayAttendanceSchema.safeParse(events.some((event) => event.slug === "sabado")
          ? body.saturdayAttendance
          : Array(companions.length + 1).fill("no"));
        if (!answers.success || answers.data.length !== companions.length + 1) {
          return NextResponse.json({ message: "Indica si asistirá cada persona." }, { status: 400 });
        }
        party.saturdayAttendance = answers.data;
        body.attendsSaturday = answers.data.includes("yes") ? "yes" : "no";
      }
      for (const [slug, field] of [["viernes", "attendsFriday"], ["sabado", "attendsSaturday"], ["domingo", "attendsSunday"]]) {
        if (!events.some((event) => event.slug === slug)) body[field] = "no";
      }
    }
    const parsed = rsvpSchema.safeParse(saturdayOnly ? { ...body, attendsFriday: "no", attendsSunday: "no" } : body);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || "form");
        if (!errors[key]) errors[key] = issue.message;
      }
      return NextResponse.json({ message: "Revisa los campos marcados.", errors }, { status: 400 });
    }
    const now = new Date();
    const attendance = {
      attendsFriday: parsed.data.attendsFriday,
      attendsSaturday: parsed.data.attendsSaturday,
      attendsSunday: parsed.data.attendsSunday,
    };
    if (phase === "final" && Object.values(attendance).includes("maybe")) {
      return NextResponse.json({ message: "Elige sí o no para confirmar la asistencia." }, { status: 400 });
    }
    const comment = parsed.data.comment?.trim() || null;
    await db.insert(rsvpResponses).values({ id: newId(), fullName: parsed.data.fullName, invitationGuestId: invitationGuest?.id ?? null, phase, party, ...attendance, comment, source: "public", submittedAt: now, updatedAt: now });
    return NextResponse.json({ confirmation: { ...parsed.data, ...attendance, comment, party } }, { status: 201 });
  } catch (error) {
    console.error("Error al guardar RSVP", error instanceof Error ? error.message : error);
    return NextResponse.json({ message: "No fue posible guardar la respuesta. Intenta nuevamente." }, { status: 500 });
  }
}
