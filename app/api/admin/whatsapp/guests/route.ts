import { NextResponse } from "next/server";
import { requireAdminApi } from "@/src/lib/auth";
import { createManualInvitationGuest, getSaveTheDateResponse } from "@/src/lib/invitation-guests";
import { manualInvitationGuestSchema } from "@/src/lib/validation";

export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = manualInvitationGuestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message || "Revisa los datos de la persona." }, { status: 422 });

  const phase = new URL(request.url).searchParams.get("phase") === "final" ? "final" : "save-the-date";
  const sourceResponseId = phase === "final" ? parsed.data.sourceResponseId : undefined;
  const source = sourceResponseId ? await getSaveTheDateResponse(sourceResponseId) : null;
  if (sourceResponseId && !source) return NextResponse.json({ message: "No encontramos la respuesta del Save the Date." }, { status: 404 });

  const prefix = parsed.data.prefix.replace(/\D/g, "");
  const phone = parsed.data.phoneNumber.replace(/\D/g, "");
  const result = await createManualInvitationGuest({
    name: parsed.data.name,
    phoneNumber: prefix && phone ? `+${prefix}${phone}` : source?.phoneNumber ?? null,
    saturdayOnly: parsed.data.saturdayOnly,
    phase,
    sourceResponseId,
    companions: phase === "final" ? parsed.data.companions : undefined,
  });
  if (result.duplicatePhone) return NextResponse.json({ message: "Ya existe una invitación con ese teléfono." }, { status: 409 });
  return NextResponse.json({ guest: result.guest }, { status: 201 });
}
