import "server-only";

import { and, eq, isNull } from "drizzle-orm";
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
      saturdayOnly: record.soloInvitadoSabado, customMessage: record.customMessage, invitationOpenedAt: null,
      createdAt: now, updatedAt: now,
    };
    await db.insert(invitationGuests).values(guest);
    imported += 1;
  }
  return { imported, skipped };
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
