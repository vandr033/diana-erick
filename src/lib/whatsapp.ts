import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/src/db/client";
import { invitationGuests, whatsappMessages, type InvitationGuest, type WhatsappMessageStatus } from "@/src/db/schema";
import { newId, newToken } from "@/src/lib/utils";
import type { GuestImportRecord } from "@/src/lib/guest-import";

const defaultMessage = "Hola {name}, nos encantaría que nos acompañes en nuestra boda.\n\nPuedes ver tu invitación y confirmar tu asistencia aquí:\n{link}";

export function invitationUrl(origin: string, token: string, saturdayOnly: boolean) {
  return `${origin.replace(/\/$/, "")}/invitacion/${token}${saturdayOnly ? "/sabado" : ""}`;
}

export function renderWhatsappMessage(template: string | null, guest: Pick<InvitationGuest, "name" | "token" | "saturdayOnly">, origin: string) {
  const link = invitationUrl(origin, guest.token, guest.saturdayOnly);
  return (template || defaultMessage)
    .replaceAll("{name}", guest.name)
    .replaceAll("{link}", link);
}

export async function importGuests(records: GuestImportRecord[], origin: string) {
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
    await db.insert(whatsappMessages).values({
      id: newId(), guestId: guest.id, content: renderWhatsappMessage(record.customMessage, guest, origin),
      status: "queued", providerMessageId: null, errorMessage: null, attempts: 0, queuedAt: now,
      processingStartedAt: null, sentAt: null, deliveredAt: null, readAt: null, failedAt: null, updatedAt: now,
    });
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

export async function claimNextWhatsappMessage() {
  const next = await db.select().from(whatsappMessages).where(eq(whatsappMessages.status, "queued")).orderBy(asc(whatsappMessages.queuedAt)).limit(1);
  const message = next[0];
  if (!message) return null;
  const claimed = await db.update(whatsappMessages)
    .set({ status: "sending", processingStartedAt: new Date(), attempts: message.attempts + 1, updatedAt: new Date() })
    .where(and(eq(whatsappMessages.id, message.id), eq(whatsappMessages.status, "queued")))
    .returning();
  if (!claimed[0]) return null;
  const guests = await db.select().from(invitationGuests).where(eq(invitationGuests.id, message.guestId)).limit(1);
  return guests[0] ? { message: claimed[0], guest: guests[0] } : null;
}

export async function sendWhatsappText(to: string, text: string) {
  const apiKey = process.env.WA_SENDER_API_KEY;
  if (!apiKey) throw new Error("WA_SENDER_API_KEY no está configurada.");
  const response = await fetch("https://www.wasenderapi.com/api/send-message", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ to, text }),
    signal: AbortSignal.timeout(10_000),
  });
  const payload = await response.json().catch(() => null) as { success?: boolean; message?: string; data?: { msgId?: string | number } } | null;
  if (!response.ok || !payload?.success || payload.data?.msgId === undefined) throw new Error(payload?.message || `WA Sender devolvió HTTP ${response.status}.`);
  return String(payload.data.msgId);
}

export async function markWhatsappSendResult(messageId: string, result: { providerMessageId?: string; error?: string }) {
  const now = new Date();
  await db.update(whatsappMessages).set(result.error ? {
    status: "failed", errorMessage: result.error.slice(0, 1000), failedAt: now, processingStartedAt: null, updatedAt: now,
  } : {
    status: "sent", providerMessageId: result.providerMessageId!, errorMessage: null, sentAt: now, processingStartedAt: null, updatedAt: now,
  }).where(eq(whatsappMessages.id, messageId));
}

export async function requeueWhatsappMessage(id: string) {
  const result = await db.update(whatsappMessages).set({ status: "queued", errorMessage: null, processingStartedAt: null, queuedAt: new Date(), updatedAt: new Date() })
    .where(eq(whatsappMessages.id, id)).returning({ id: whatsappMessages.id });
  return Boolean(result[0]);
}

export function statusFromWebhook(value: unknown): WhatsappMessageStatus | null {
  const code = typeof value === "number" ? value : Number(value);
  return code === 0 ? "failed" : code === 1 ? "queued" : code === 2 ? "sent" : code === 3 ? "delivered" : code === 4 || code === 5 ? "read" : null;
}

export async function applyWhatsappWebhook(providerMessageId: string, status: WhatsappMessageStatus) {
  const existing = await db.select({ status: whatsappMessages.status }).from(whatsappMessages).where(eq(whatsappMessages.providerMessageId, providerMessageId)).limit(1);
  const current = existing[0]?.status as WhatsappMessageStatus | undefined;
  const order: Record<WhatsappMessageStatus, number> = { queued: 0, sending: 1, sent: 2, delivered: 3, read: 4, failed: 5 };
  if (!current || (current !== "failed" && status !== "failed" && order[status] < order[current])) return;
  const now = new Date();
  const values = status === "failed" ? { status, failedAt: now, updatedAt: now } : status === "delivered" ? { status, deliveredAt: now, updatedAt: now } : status === "read" ? { status, readAt: now, updatedAt: now } : { status, updatedAt: now };
  await db.update(whatsappMessages).set(values).where(eq(whatsappMessages.providerMessageId, providerMessageId));
}
