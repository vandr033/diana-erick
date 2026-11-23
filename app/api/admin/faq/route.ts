import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/src/db/client";
import { weddingFaq } from "@/src/db/schema";
import { requireAdminApi } from "@/src/lib/auth";

const entriesSchema = z.array(z.object({
  id: z.string().regex(/^[a-zA-Z0-9-]+$/).max(64),
  question: z.string().trim().min(1, "Escribe una pregunta.").max(160),
  answer: z.string().trim().min(1, "Escribe una respuesta.").max(1500),
  published: z.boolean(),
})).max(50).refine((entries) => new Set(entries.map(({ id }) => id)).size === entries.length);

export async function PUT(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  const parsed = entriesSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
  try {
    const entries = parsed.data;
    await db.insert(weddingFaq).values({ id: 1, entries })
      .onConflictDoUpdate({ target: weddingFaq.id, set: { entries } });
    revalidatePath("/boda/[[...invitation]]", "page");
    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ message: "No se pudieron guardar las preguntas." }, { status: 500 });
  }
}
