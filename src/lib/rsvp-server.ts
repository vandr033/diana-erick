import { NextResponse } from "next/server";
import { db } from "@/src/db/client";
import { rsvpResponses } from "@/src/db/schema";
import { rsvpSchema } from "@/src/lib/validation";
import { newId } from "@/src/lib/utils";

export async function handleRsvpSubmission(request: Request, scope: "all" | "saturday") {
  try {
    const body = await request.json() as Record<string, unknown>;
    if (body.honeypot) return NextResponse.json({ ok: true, confirmation: body }, { status: 201 });
    const parsed = rsvpSchema.safeParse(body);
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
      attendsFriday: scope === "saturday" ? "no" as const : parsed.data.attendsFriday,
      attendsSaturday: parsed.data.attendsSaturday,
      attendsSunday: scope === "saturday" ? "no" as const : parsed.data.attendsSunday,
    };
    const comment = parsed.data.comment?.trim() || null;
    await db.insert(rsvpResponses).values({ id: newId(), fullName: parsed.data.fullName, ...attendance, comment, source: "public", submittedAt: now, updatedAt: now });
    return NextResponse.json({ confirmation: { ...parsed.data, ...attendance, comment } }, { status: 201 });
  } catch (error) {
    console.error("Error al guardar RSVP", error instanceof Error ? error.message : error);
    return NextResponse.json({ message: "No fue posible guardar la respuesta. Intenta nuevamente." }, { status: 500 });
  }
}
