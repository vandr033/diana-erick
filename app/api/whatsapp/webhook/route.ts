import { NextResponse } from "next/server";
import { applyWhatsappWebhook, statusFromWebhook } from "@/src/lib/whatsapp";

function isAuthorized(request: Request) {
  const secret = process.env.WA_SENDER_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const authorization = request.headers.get("authorization");
  return request.headers.get("x-webhook-signature") === secret || authorization === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  const body = await request.json().catch(() => null) as { event?: string; data?: { update?: { status?: unknown }; key?: { id?: unknown } } } | null;
  if (body?.event !== "messages.update") return NextResponse.json({ ok: true });
  const messageId = body.data?.key?.id;
  const status = statusFromWebhook(body.data?.update?.status);
  if (typeof messageId !== "string" && typeof messageId !== "number") return NextResponse.json({ message: "Webhook inválido." }, { status: 400 });
  if (!status) return NextResponse.json({ ok: true });
  await applyWhatsappWebhook(String(messageId), status);
  return NextResponse.json({ ok: true });
}
