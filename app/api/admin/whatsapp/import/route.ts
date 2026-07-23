import { NextResponse } from "next/server";
import { requireAdminApi } from "@/src/lib/auth";
import { validateGuestImportRows } from "@/src/lib/guest-import";
import { importGuests } from "@/src/lib/whatsapp";

export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  const body = await request.json().catch(() => null) as { rows?: unknown[] } | null;
  if (!Array.isArray(body?.rows) || !body.rows.length) return NextResponse.json({ message: "No se encontraron filas para importar." }, { status: 400 });
  if (body.rows.length > 1_000) return NextResponse.json({ message: "Importa hasta 1.000 filas por archivo." }, { status: 400 });
  const validation = validateGuestImportRows(body.rows);
  if (validation.errors.length) return NextResponse.json({ message: "Corrige las filas indicadas antes de importar.", errors: validation.errors }, { status: 422 });
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const result = await importGuests(validation.records, origin);
  return NextResponse.json({ ...result, total: validation.records.length }, { status: 201 });
}
