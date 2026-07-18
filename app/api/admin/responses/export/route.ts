import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { and, desc } from "drizzle-orm";
import { db } from "@/src/db/client";
import { responseFilterConditions } from "@/src/db/queries";
import { rsvpResponses } from "@/src/db/schema";
import { requireAdminApi } from "@/src/lib/auth";
import { formatDateTime } from "@/src/lib/dates";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  try {
    const url = new URL(request.url);
    const filters = { q: url.searchParams.get("q") || "", event: url.searchParams.get("event") || "", attendance: url.searchParams.get("attendance") || "", dateFrom: url.searchParams.get("dateFrom") || "", dateTo: url.searchParams.get("dateTo") || "" };
    const conditions = responseFilterConditions(filters);
    const rows = await db.select().from(rsvpResponses).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(rsvpResponses.submittedAt));
    const yes = (value: boolean) => value ? "Sí" : "No";
    const responseRows = rows.map((row) => ({ "Nombre completo": row.fullName, "Viernes 9 de abril": yes(row.attendsFriday), "Sábado 10 de abril": yes(row.attendsSaturday), "Domingo 11 de abril": yes(row.attendsSunday), "Comentario": row.comment || "", "Fecha de respuesta": formatDateTime(row.submittedAt), "Última actualización": formatDateTime(row.updatedAt), "Origen": row.source === "admin" ? "Administrador" : "Invitado" }));
    const confirmations = rows.filter((row) => row.attendsFriday || row.attendsSaturday || row.attendsSunday).length;
    const summaryRows = [
      { Métrica: "Total de respuestas", Valor: rows.length },
      { Métrica: "Confirmaciones", Valor: confirmations },
      { Métrica: "No asisten a ningún evento", Valor: rows.filter((row) => !row.attendsFriday && !row.attendsSaturday && !row.attendsSunday).length },
      { Métrica: "Asisten el viernes", Valor: rows.filter((row) => row.attendsFriday).length },
      { Métrica: "No asisten el viernes", Valor: rows.filter((row) => !row.attendsFriday).length },
      { Métrica: "Asisten el sábado", Valor: rows.filter((row) => row.attendsSaturday).length },
      { Métrica: "No asisten el sábado", Valor: rows.filter((row) => !row.attendsSaturday).length },
      { Métrica: "Asisten el domingo", Valor: rows.filter((row) => row.attendsSunday).length },
      { Métrica: "No asisten el domingo", Valor: rows.filter((row) => !row.attendsSunday).length },
      { Métrica: "Fecha de generación", Valor: formatDateTime(new Date()) },
      { Métrica: "Filtros aplicados", Valor: Object.values(filters).some(Boolean) ? "Sí" : "No" },
    ];
    const workbook = XLSX.utils.book_new();
    const responsesSheet = XLSX.utils.json_to_sheet(responseRows);
    responsesSheet["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 42 }, { wch: 24 }, { wch: 24 }, { wch: 16 }];
    responsesSheet["!autofilter"] = { ref: `A1:H${Math.max(responseRows.length + 1, 2)}` };
    responsesSheet["!freeze"] = { xSplit: 0, ySplit: 1 };
    XLSX.utils.book_append_sheet(workbook, responsesSheet, "RESPUESTAS");
    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
    summarySheet["!cols"] = [{ wch: 34 }, { wch: 24 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, "RESUMEN");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
    const filename = `confirmaciones-diana-erick-${new Date().toISOString().slice(0, 10)}.xlsx`;
    return new NextResponse(new Uint8Array(buffer), { status: 200, headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error al exportar respuestas", error instanceof Error ? error.message : error);
    return NextResponse.json({ message: "No fue posible generar el archivo." }, { status: 500 });
  }
}
