import { NextResponse } from "next/server";
import { claimNextWhatsappMessage, markWhatsappSendResult, sendWhatsappText } from "@/src/lib/whatsapp";

export const runtime = "nodejs";
export const maxDuration = 60;

const pause = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function isCronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  const processed: string[] = [];
  for (let index = 0; index < 4; index += 1) {
    const claimed = await claimNextWhatsappMessage();
    if (!claimed) break;
    try {
      const providerMessageId = await sendWhatsappText(claimed.guest.phoneNumber, claimed.message.content);
      await markWhatsappSendResult(claimed.message.id, { providerMessageId });
      processed.push(claimed.message.id);
    } catch (error) {
      await markWhatsappSendResult(claimed.message.id, { error: error instanceof Error ? error.message : "No fue posible enviar el mensaje." });
    }
    if (index < 3) await pause(5_000);
  }
  return NextResponse.json({ processed: processed.length });
}
