import "server-only";

import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/src/db/client";
import { invitationGuests, type InvitationGuest } from "@/src/db/schema";
import { newId, newToken } from "@/src/lib/utils";
import type { GuestImportRecord } from "@/src/lib/guest-import";

export async function importGuests(records: GuestImportRecord[]) {
  let imported = 0;
  let skipped = 0;
  for (const record of records) {
    const existing = await db.select({ id: invitationGuests.id }).from(invitationGuests).where(eq(invitationGuests.phoneNumber, record.phoneNumber)).limit(1);
    if (existing[0]) {
      skipped += 1;
      continue;
    }
    const now = new Date();
    const guest: InvitationGuest = {
      id: newId(), token: newToken(), name: record.name, phoneNumber: record.phoneNumber,
      saturdayOnly: record.soloInvitadoSabado, customMessage: record.customMessage, whatsappSentAt: null, invitationOpenedAt: null,
      createdAt: now, updatedAt: now,
    };
    await db.insert(invitationGuests).values(guest);
    imported += 1;
  }
  return { imported, skipped };
}

export async function createManualInvitationGuest(input: { name: string; phoneNumber: string | null; saturdayOnly: boolean }) {
  if (input.phoneNumber) {
    const existing = await db.select({ id: invitationGuests.id }).from(invitationGuests).where(eq(invitationGuests.phoneNumber, input.phoneNumber)).limit(1);
    if (existing[0]) return { guest: null, duplicatePhone: true };
  }

  const now = new Date();
  const guest: InvitationGuest = {
    id: newId(), token: newToken(), name: input.name, phoneNumber: input.phoneNumber,
    saturdayOnly: input.saturdayOnly, customMessage: null, whatsappSentAt: null, invitationOpenedAt: null,
    createdAt: now, updatedAt: now,
  };
  await db.insert(invitationGuests).values(guest);
  return { guest, duplicatePhone: false };
}

export async function getInvitationGuest(token: string) {
  const rows = await db.select().from(invitationGuests).where(eq(invitationGuests.token, token)).limit(1);
  return rows[0] ?? null;
}

export async function markInvitationOpened(token: string) {
  await db.update(invitationGuests)
    .set({ invitationOpenedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(invitationGuests.token, token), isNull(invitationGuests.invitationOpenedAt)));
}

export async function updateInvitationGuest(id: string, input: { name: string; phoneNumber: string | null; saturdayOnly: boolean; customMessage: string | null }) {
  if (input.phoneNumber) {
    const existing = await db.select({ id: invitationGuests.id }).from(invitationGuests)
      .where(and(eq(invitationGuests.phoneNumber, input.phoneNumber), ne(invitationGuests.id, id))).limit(1);
    if (existing[0]) return { guest: null, duplicatePhone: true };
  }
  const updated = await db.update(invitationGuests).set({ ...input, updatedAt: new Date() }).where(eq(invitationGuests.id, id)).returning();
  return { guest: updated[0] ?? null, duplicatePhone: false };
}

export async function markWhatsappSent(id: string) {
  const updated = await db.update(invitationGuests).set({ whatsappSentAt: new Date(), updatedAt: new Date() }).where(eq(invitationGuests.id, id)).returning();
  return updated[0] ?? null;
}

export async function deleteInvitationGuest(id: string) {
  const deleted = await db.delete(invitationGuests).where(eq(invitationGuests.id, id)).returning({ id: invitationGuests.id });
  return Boolean(deleted[0]);
}
