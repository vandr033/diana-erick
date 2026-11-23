import { NextResponse } from "next/server";
import { requireAdminApi } from "@/src/lib/auth";
import { getWeddingImportPreview, importWeddingGuests, weddingImportSchema } from "@/src/lib/wedding-import";

export async function GET() {
  if (!await requireAdminApi()) return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  return NextResponse.json(await getWeddingImportPreview(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  const parsed = weddingImportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message || "Revisa las invitaciones." }, { status: 422 });
  }

  const result = await importWeddingGuests(parsed.data);
  switch (result.result) {
    case "imported":
      return NextResponse.json({ count: result.count }, { status: 201 });
    case "duplicate-phone":
      return NextResponse.json({ message: "Hay teléfonos repetidos entre las invitaciones seleccionadas." }, { status: 422 });
    case "conflict":
      return NextResponse.json({ message: "Uno de los teléfonos ya está en la lista de boda o las invitaciones cambiaron. Revisa los teléfonos o vuelve a cargar la vista previa." }, { status: 409 });
    case "stale":
      return NextResponse.json({ message: "La lista cambió. Vuelve a cargar la vista previa y revisa los datos." }, { status: 409 });
  }
}
