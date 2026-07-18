import { NextResponse } from "next/server";
import { db } from "@/src/db/client";
import { rsvpResponses } from "@/src/db/schema";
import { requireAdminApi } from "@/src/lib/auth";
import { responseAdminSchema } from "@/src/lib/validation";
import { newId } from "@/src/lib/utils";

export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  const parsed = responseAdminSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message || "Revisa los campos." }, { status: 400 });
  const now = new Date();
  const result = await db.insert(rsvpResponses).values({ id: newId(), fullName: parsed.data.fullName, attendsFriday: parsed.data.attendsFriday, attendsSaturday: parsed.data.attendsSaturday, attendsSunday: parsed.data.attendsSunday, comment: parsed.data.comment?.trim() || null, source: "admin", submittedAt: now, updatedAt: now }).returning({ id: rsvpResponses.id });
  return NextResponse.json({ id: result[0]?.id }, { status: 201 });
}
