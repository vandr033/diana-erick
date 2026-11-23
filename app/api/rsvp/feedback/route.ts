import { and, eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/src/db/client";
import { rsvpResponses } from "@/src/db/schema";

const localDateTime = z.iso.datetime({ local: true, precision: -1, error: "Ingresa una fecha y hora válidas." })
  .refine((value) => value.length === 16, "Usa la hora local de Santa Cruz.");

const feedbackSchema = z.object({
  receipt: z.uuid(),
  feedback: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("food"),
      hasRestrictions: z.enum(["yes", "no"], { error: "Selecciona Sí o No." }),
      details: z.string().trim().max(500, "Usa hasta 500 caracteres."),
    }).refine(({ hasRestrictions, details }) => hasRestrictions === "no" || details.length > 0,
      "Cuéntanos qué restricción debemos tener en cuenta."),
    z.object({
      kind: z.literal("music"),
      song: z.string().trim().min(1, "Escribe una canción o un artista.").max(500, "Usa hasta 500 caracteres."),
    }),
    z.object({
      kind: z.literal("flight"),
      arrival: localDateTime,
      departure: localDateTime.optional(),
      notes: z.string().trim().max(500, "Usa hasta 500 caracteres."),
    }).refine(({ arrival, departure }) => !departure || departure > arrival,
      "La salida debe ser posterior a la llegada."),
  ]),
});

export async function PATCH(request: Request) {
  const parsed = feedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
  const { receipt, feedback } = parsed.data;
  const changes = feedback.kind === "food"
    ? { foodFeedback: { hasRestrictions: feedback.hasRestrictions, details: feedback.details } }
    : feedback.kind === "music"
      ? { musicFeedback: { song: feedback.song } }
      : { flightFeedback: { arrival: feedback.arrival, departure: feedback.departure, notes: feedback.notes } };

  try {
    const [updated] = await db.update(rsvpResponses).set(changes).where(and(
      eq(rsvpResponses.id, receipt),
      eq(rsvpResponses.phase, "final"),
      eq(rsvpResponses.source, "public"),
      or(eq(rsvpResponses.attendsFriday, "yes"), eq(rsvpResponses.attendsSaturday, "yes"), eq(rsvpResponses.attendsSunday, "yes")),
    )).returning({ id: rsvpResponses.id });
    if (!updated) return NextResponse.json({ message: "No encontramos tu confirmación." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "No pudimos guardar tu respuesta. Intenta nuevamente." }, { status: 500 });
  }
}
