import { NextResponse } from "next/server";
import { requireAdminApi } from "@/src/lib/auth";
import { deleteInvitationGuest, markWhatsappSent, updateInvitationGuest } from "@/src/lib/invitation-guests";
import { invitationGuestUpdateSchema } from "@/src/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApi()) return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => null) as { action?: string } | null;

  if (body?.action === "mark-sent") {
    const guest = await markWhatsappSent(id);
    return guest ? NextResponse.json({ guest }) : NextResponse.json({ message: "No encontramos a ese invitado." }, { status: 404 });
  }

  const parsed = invitationGuestUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message || "Revisa los datos de la persona." }, { status: 422 });
  const phoneDigits = parsed.data.phoneNumber?.replace(/\D/g, "") ?? "";
  const result = await updateInvitationGuest(id, {
    ...parsed.data,
    phoneNumber: phoneDigits ? `+${phoneDigits}` : null,
    customMessage: parsed.data.customMessage || null,
  });
  if (result.duplicatePhone) return NextResponse.json({ message: "Ya existe una invitación con ese teléfono." }, { status: 409 });
  return result.guest ? NextResponse.json({ guest: result.guest }) : NextResponse.json({ message: "No encontramos a ese invitado." }, { status: 404 });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminApi()) return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  const { id } = await params;
  const deleted = await deleteInvitationGuest(id);
  return deleted ? NextResponse.json({ ok: true }) : NextResponse.json({ message: "No encontramos a ese invitado." }, { status: 404 });
}
