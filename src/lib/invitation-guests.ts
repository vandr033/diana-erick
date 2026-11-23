import "server-only";

import { and, eq, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/src/db/client";
import { invitationGuests, rsvpResponses, type InvitationPhase } from "@/src/db/schema";
import { newId, newToken } from "@/src/lib/utils";
import type { GuestImportRecord } from "@/src/lib/guest-import";

export async function importGuests(records: GuestImportRecord[]) {
  let imported = 0;
  let skipped = 0;
  for (const record of records) {
    const inserted = await db.insert(invitationGuests).values({
      id: newId(), token: newToken(), name: record.name, phoneNumber: record.phoneNumber,
      saturdayOnly: record.soloInvitadoSabado, customMessage: record.customMessage,
    }).onConflictDoNothing({ target: [invitationGuests.phase, invitationGuests.phoneNumber] }).returning({ id: invitationGuests.id });
    if (inserted.length) imported += 1;
    else skipped += 1;
  }
  return { imported, skipped };
}

export async function getSaveTheDateResponse(id: string) {
  const [result] = await db.select({
    fullName: rsvpResponses.fullName,
    phoneNumber: invitationGuests.phoneNumber,
    saturdayOnly: invitationGuests.saturdayOnly,
  }).from(rsvpResponses)
    .leftJoin(invitationGuests, eq(rsvpResponses.invitationGuestId, invitationGuests.id))
    .where(and(eq(rsvpResponses.id, id), eq(rsvpResponses.phase, "save-the-date")))
    .limit(1);
  return result ?? null;
}

export async function createManualInvitationGuest(input: { name: string; phoneNumber: string | null; saturdayOnly: boolean; phase: InvitationPhase; sourceResponseId?: string; companions?: string[] }) {
  const [guest] = await db.insert(invitationGuests).values({
    ...input, id: newId(), token: newToken(),
  }).onConflictDoNothing().returning();
  if (guest) return { guest, duplicatePhone: false };
  if (input.sourceResponseId) {
    const [existing] = await db.select().from(invitationGuests)
      .where(eq(invitationGuests.sourceResponseId, input.sourceResponseId)).limit(1);
    if (existing) return { guest: existing, duplicatePhone: false };
  }
  return { guest: null, duplicatePhone: true };
}

export async function getInvitationGuest(token: string, phase: InvitationPhase = "save-the-date") {
  const rows = await db.select().from(invitationGuests)
    .where(and(eq(invitationGuests.token, token), eq(invitationGuests.phase, phase))).limit(1);
  return rows[0] ?? null;
}

export async function markInvitationOpened(token: string) {
  await db.update(invitationGuests)
    .set({ invitationOpenedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(invitationGuests.token, token), isNull(invitationGuests.invitationOpenedAt)));
}

export async function updateInvitationGuest(id: string, input: { name: string; phoneNumber: string | null; saturdayOnly: boolean; customMessage: string | null; companions?: string[] }, phase: InvitationPhase) {
  if (input.phoneNumber) {
    const existing = await db.select({ id: invitationGuests.id }).from(invitationGuests)
      .where(and(eq(invitationGuests.phoneNumber, input.phoneNumber), eq(invitationGuests.phase, phase), ne(invitationGuests.id, id))).limit(1);
    if (existing[0]) return { guest: null, duplicatePhone: true };
  }
  const updated = await db.update(invitationGuests).set({ ...input, updatedAt: new Date() })
    .where(and(eq(invitationGuests.id, id), eq(invitationGuests.phase, phase))).returning();
  return { guest: updated[0] ?? null, duplicatePhone: false };
}

export async function markWhatsappSent(id: string, phase: InvitationPhase) {
  const updated = await db.update(invitationGuests).set({ whatsappSentAt: new Date(), updatedAt: new Date() })
    .where(and(eq(invitationGuests.id, id), eq(invitationGuests.phase, phase))).returning();
  return updated[0] ?? null;
}

export async function deleteInvitationGuest(id: string, phase: InvitationPhase) {
  const where = and(eq(invitationGuests.id, id), eq(invitationGuests.phase, phase));
  if (phase === "final") {
    const deleted = await db.delete(invitationGuests).where(where).returning({ id: invitationGuests.id });
    return Boolean(deleted[0]);
  }
  const guest = await db.select({ id: invitationGuests.id, name: invitationGuests.name }).from(invitationGuests).where(where).limit(1);
  if (!guest[0]) return false;
  await db.delete(rsvpResponses).where(and(eq(rsvpResponses.phase, phase), or(
    eq(rsvpResponses.invitationGuestId, id),
    and(
      isNull(rsvpResponses.invitationGuestId),
      eq(rsvpResponses.source, "public"),
      sql`lower(trim(${rsvpResponses.fullName})) = lower(trim(${guest[0].name}))`,
    ),
  )));
  const deleted = await db.delete(invitationGuests).where(where).returning({ id: invitationGuests.id });
  return Boolean(deleted[0]);
}
