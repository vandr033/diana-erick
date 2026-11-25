import "server-only";

import { createHash } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/src/db/client";
import { invitationGuests, rsvpResponses } from "@/src/db/schema";
import { newId, newToken } from "./utils";
import { companionNames } from "./validation";
import { guestNameKey, splitGuestName } from "./wedding-import-names";

export const weddingImportSchema = z.object({
  revision: z.string().regex(/^[a-f0-9]{64}$/),
  rows: z.array(z.object({
    key: z.string().min(1).max(250),
    name: z.string().trim().min(1, "Ingresa el nombre del invitado.").max(150),
    companions: companionNames,
    phoneNumber: z.union([z.literal(""), z.string().regex(/^\+\d{8,15}$/, "Usa un teléfono internacional, por ejemplo +59170000000.")]).transform((value) => value || null),
    saturdayOnly: z.boolean({ error: "Selecciona los eventos de cada invitación." }),
    transportIncluded: z.boolean({ error: "Selecciona si la invitación incluye transporte." }),
  })).min(1, "Selecciona al menos una invitación."),
});

type ImportDraft = z.output<typeof weddingImportSchema>;

function partyKey(name: string, companions: string[]) {
  return JSON.stringify([name, ...companions].map(guestNameKey));
}

function originalNameKey(value: string) {
  const { name, companions } = splitGuestName(value);
  return partyKey(name, companions);
}

function groupBy<T>(items: T[], keyFor: (item: T) => string) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFor(item);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}

export async function getWeddingImportPreview(executor: Pick<typeof db, "select"> = db) {
  const [guests, responses] = await Promise.all([
    executor.select({
      id: invitationGuests.id, name: invitationGuests.name, phoneNumber: invitationGuests.phoneNumber,
      saturdayOnly: invitationGuests.saturdayOnly, phase: invitationGuests.phase, companions: invitationGuests.companions,
      sourceGuestId: invitationGuests.sourceGuestId, sourceResponseId: invitationGuests.sourceResponseId,
    }).from(invitationGuests).orderBy(invitationGuests.name, invitationGuests.id),
    executor.select({ id: rsvpResponses.id, fullName: rsvpResponses.fullName, invitationGuestId: rsvpResponses.invitationGuestId })
      .from(rsvpResponses).where(eq(rsvpResponses.phase, "save-the-date")).orderBy(desc(rsvpResponses.submittedAt), rsvpResponses.id),
  ]);
  const contacts = guests.filter((guest) => guest.phase === "save-the-date");
  const finals = guests.filter((guest) => guest.phase === "final");
  const contactIds = new Set(contacts.map((guest) => guest.id));
  const contactsByName = groupBy(contacts, (guest) => originalNameKey(guest.name));
  const contactsByPrimary = groupBy(contacts, (guest) => guestNameKey(splitGuestName(guest.name).name));
  const ambiguousNames = new Set<string>();
  const responseGroups = groupBy(responses, (response) => {
    if (response.invitationGuestId && contactIds.has(response.invitationGuestId)) return `guest:${response.invitationGuestId}`;
    const name = originalNameKey(response.fullName);
    const matching = contactsByName.get(name);
    if (matching?.length === 1) return `guest:${matching[0].id}`;
    const parsed = splitGuestName(response.fullName);
    const primaryMatches = contactsByPrimary.get(guestNameKey(parsed.name)) ?? [];
    if (!matching?.length && primaryMatches.length === 1
      && (!parsed.companions.length || !splitGuestName(primaryMatches[0].name).companions.length)) {
      return `guest:${primaryMatches[0].id}`;
    }
    if (primaryMatches.length > 0) ambiguousNames.add(name);
    return `name:${name}`;
  });
  const finalPhones = new Set(finals.flatMap((guest) => guest.phoneNumber ? [guest.phoneNumber] : []));
  const importedContacts = new Set(finals.map((guest) => guest.sourceGuestId));
  const importedResponses = new Set(finals.map((guest) => guest.sourceResponseId));
  const finalNameKeys = new Set(finals.map((guest) => guest.companions.length ? partyKey(guest.name, guest.companions) : originalNameKey(guest.name)));

  const rows = [
    ...contacts.map((guest) => {
      const key = `guest:${guest.id}`;
      const matched = responseGroups.get(key) ?? [];
      const groupResponse = matched.find((row) => splitGuestName(row.fullName).companions.length > 0);
      const original = groupResponse?.fullName ?? guest.name;
      const parsed = splitGuestName(original);
      return {
        key, original, ...parsed, phoneNumber: guest.phoneNumber, saturdayOnly: guest.saturdayOnly,
        contactName: original === guest.name ? null : guest.name,
        sourceGuestId: guest.id, sourceResponseId: groupResponse?.id ?? matched[0]?.id ?? null,
        alreadyInvited: importedContacts.has(guest.id) || matched.some((row) => importedResponses.has(row.id))
          || (guest.phoneNumber !== null && finalPhones.has(guest.phoneNumber))
          || (guest.phoneNumber === null && finalNameKeys.has(partyKey(parsed.name, parsed.companions))),
        ambiguous: false,
      };
    }),
    ...Array.from(responseGroups.entries()).filter(([key]) => key.startsWith("name:")).map(([key, group]) => {
      const [response] = group;
      const parsed = splitGuestName(response.fullName);
      return {
        key: `response:${response.id}`, original: response.fullName, ...parsed, phoneNumber: null, saturdayOnly: null,
        contactName: null,
        sourceGuestId: null, sourceResponseId: response.id,
        alreadyInvited: group.some((row) => importedResponses.has(row.id)) || finalNameKeys.has(partyKey(parsed.name, parsed.companions)),
        ambiguous: ambiguousNames.has(key.slice(5)),
      };
    }),
  ].sort((a, b) => a.original.localeCompare(b.original, "es") || a.key.localeCompare(b.key));
  const revision = createHash("sha256").update(JSON.stringify([rows, finals])).digest("hex");
  return { rows, revision };
}

export type WeddingImportPreview = Awaited<ReturnType<typeof getWeddingImportPreview>>;

export async function importWeddingGuests(draft: ImportDraft) {
  try {
    return await db.transaction(async (tx) => {
      const preview = await getWeddingImportPreview(tx);
      if (draft.revision !== preview.revision) return { result: "stale" } as const;
      const available = new Map(preview.rows.filter((row) => !row.alreadyInvited).map((row) => [row.key, row]));
      const selected = new Set<string>();
      const phones = new Set<string>();
      const records: (typeof invitationGuests.$inferInsert)[] = [];
      for (const { key, ...input } of draft.rows) {
        const source = available.get(key);
        if (!source || selected.has(key)) return { result: "stale" } as const;
        if (input.phoneNumber && phones.has(input.phoneNumber)) return { result: "duplicate-phone" } as const;
        selected.add(key);
        if (input.phoneNumber) phones.add(input.phoneNumber);
        records.push({
          ...input, phase: "final", id: newId(), token: newToken(),
          sourceGuestId: source.sourceGuestId, sourceResponseId: source.sourceResponseId,
        });
      }

      for (let offset = 0; offset < records.length; offset += 25) {
        await tx.insert(invitationGuests).values(records.slice(offset, offset + 25));
      }
      return { result: "imported", count: records.length } as const;
    });
  } catch (error) {
    if (error instanceof Error && /SQLITE_CONSTRAINT|UNIQUE constraint failed/.test(String(error.cause ?? error))) {
      return { result: "conflict" } as const;
    }
    throw error;
  }
}
