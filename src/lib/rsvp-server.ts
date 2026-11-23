import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/src/db/client";
import { getEvents, getSettings } from "@/src/db/queries";
import { rsvpResponses, type PartyResponse, type RsvpResponse } from "@/src/db/schema";
import { getInvitationGuest } from "@/src/lib/invitation-guests";
import { rsvpDays } from "@/src/lib/invitation-party";
import { attendanceByDaySchema, rsvpSchema, saturdayAttendanceSchema } from "@/src/lib/validation";
import { newId } from "@/src/lib/utils";

export type RsvpConfirmation = Pick<RsvpResponse, "fullName" | "attendsFriday" | "attendsSaturday" | "attendsSunday" | "comment"> & {
  party?: PartyResponse | null;
  editReceipt?: string;
  feedbackReceipt?: string;
};

export async function getLatestWeddingResponse(guestId: string, database: Pick<typeof db, "select"> = db) {
  const [response] = await database.select().from(rsvpResponses)
    .where(and(eq(rsvpResponses.invitationGuestId, guestId), eq(rsvpResponses.phase, "final")))
    .orderBy(desc(rsvpResponses.submittedAt), desc(rsvpResponses.id))
    .limit(1);
  return response;
}

export function toRsvpConfirmation({ id, invitationGuestId, phase, source, fullName, attendsFriday, attendsSaturday, attendsSunday, comment, party }: RsvpResponse): RsvpConfirmation {
  const canSendFeedback = phase === "final" && source === "public" && [attendsFriday, attendsSaturday, attendsSunday].includes("yes");
  return {
    fullName, attendsFriday, attendsSaturday, attendsSunday, comment, party,
    editReceipt: phase === "final" && invitationGuestId ? id : undefined,
    feedbackReceipt: canSendFeedback ? id : undefined,
  };
}

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
      if (body.attendanceByDay !== undefined) {
        const answers = attendanceByDaySchema.safeParse(body.attendanceByDay);
        if (!answers.success) {
          return NextResponse.json({ message: "Elige Va o No va para cada persona. Cada comentario puede tener hasta 1.000 caracteres." }, { status: 400 });
        }
        for (const { slug, field } of rsvpDays) {
          const invited = (!saturdayOnly || slug === "sabado") && events.some((event) => event.slug === slug);
          const people = answers.data[field];
          if ((!invited && people !== undefined) || (invited && people?.length !== companions.length + 1)) {
            return NextResponse.json({ message: "Confirma la asistencia de cada persona para los días de tu invitación." }, { status: 400 });
          }
          body[field] = people?.some((person) => person.attendance === "yes") ? "yes" : "no";
        }
        party = { companions, attendanceByDay: answers.data };
      } else if (companions.length) {
        party = { companions };
      }
      if (party && !party.attendanceByDay && saturdayOnly) {
        const answers = saturdayAttendanceSchema.safeParse(events.some((event) => event.slug === "sabado")
          ? body.saturdayAttendance
          : Array(companions.length + 1).fill("no"));
        if (!answers.success || answers.data.length !== companions.length + 1) {
          return NextResponse.json({ message: "Indica si asistirá cada persona." }, { status: 400 });
        }
        party.saturdayAttendance = answers.data;
        body.attendsSaturday = answers.data.includes("yes") ? "yes" : "no";
      }
      for (const { slug, field } of rsvpDays) {
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
    const changes = { fullName: parsed.data.fullName, party, ...attendance, comment: parsed.data.comment?.trim() || null, updatedAt: now };
    const newResponse: typeof rsvpResponses.$inferInsert = {
      ...changes, id: newId(), invitationGuestId: invitationGuest?.id ?? null, phase, source: "public", submittedAt: now,
    };

    if (phase === "final" && invitationGuest) {
      // Use a write transaction so simultaneous first submissions cannot both create a row.
      const result = await db.transaction(async (tx) => {
        const existing = await getLatestWeddingResponse(invitationGuest.id, tx);
        if (body.editReceipt !== undefined && body.editReceipt !== existing?.id) return null;
        if (existing && body.editReceipt === undefined) return { row: existing, status: 200 };
        if (existing) {
          const [row] = await tx.update(rsvpResponses).set(changes).where(eq(rsvpResponses.id, existing.id)).returning();
          return { row, status: 200 };
        }
        const [row] = await tx.insert(rsvpResponses).values(newResponse).returning();
        return { row, status: 201 };
      });
      if (!result) return NextResponse.json({ message: "La confirmación cambió. Recarga la invitación e inténtalo nuevamente." }, { status: 409 });
      return NextResponse.json({ confirmation: toRsvpConfirmation(result.row) }, { status: result.status });
    }

    const [row] = await db.insert(rsvpResponses).values(newResponse).returning();
    return NextResponse.json({ confirmation: toRsvpConfirmation(row) }, { status: 201 });
  } catch (error) {
    console.error("Error al guardar RSVP", error instanceof Error ? error.message : error);
    return NextResponse.json({ message: "No fue posible guardar la respuesta. Intenta nuevamente." }, { status: 500 });
  }
}
