import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { siteSettings } from "@/src/db/schema";
import { requireAdminApi } from "@/src/lib/auth";
import { settingsSchema } from "@/src/lib/validation";

export async function PUT(request: Request) { if (!await requireAdminApi()) return NextResponse.json({ message: "No autorizado." }, { status: 401 }); const parsed = settingsSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message || "Revisa los campos." }, { status: 400 }); await db.update(siteSettings).set({ ...parsed.data, updatedAt: new Date() }).where(eq(siteSettings.id, 1)); revalidatePath("/"); return NextResponse.json({ ok: true }); }
