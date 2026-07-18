import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { events } from "@/src/db/schema";
import { requireAdminApi } from "@/src/lib/auth";
import { eventSchema } from "@/src/lib/validation";
import { optionalText } from "@/src/lib/utils";

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) { if (!await requireAdminApi()) return NextResponse.json({ message: "No autorizado." }, { status: 401 }); const { slug } = await params; const parsed = eventSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message || "Revisa los campos." }, { status: 400 }); const result = await db.update(events).set({ ...parsed.data, startTime: optionalText(parsed.data.startTime), endTime: optionalText(parsed.data.endTime), venueName: optionalText(parsed.data.venueName), address: optionalText(parsed.data.address), mapsUrl: optionalText(parsed.data.mapsUrl), description: optionalText(parsed.data.description), dressCodeTitle: optionalText(parsed.data.dressCodeTitle), dressCodeDescription: optionalText(parsed.data.dressCodeDescription), additionalNote: optionalText(parsed.data.additionalNote), iconPath: optionalText(parsed.data.iconPath), updatedAt: new Date() }).where(eq(events.slug, slug)).returning({ id: events.id }); if (!result[0]) return NextResponse.json({ message: "No se encontró el evento solicitado." }, { status: 404 }); revalidatePath("/"); return NextResponse.json({ ok: true }); }
