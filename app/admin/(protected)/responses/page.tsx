import { getResponses } from "@/src/db/queries";
import { formatDateTime } from "@/src/lib/dates";
import { ResponseFilters } from "@/src/components/admin/response-filters";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const value = (item: string | string[] | undefined) => Array.isArray(item) ? item[0] || "" : item || "";

export default async function ResponsesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = { q: value(params.q), event: value(params.event), attendance: value(params.attendance), dateFrom: value(params.dateFrom), dateTo: value(params.dateTo) };
  const requestedPage = Math.max(1, Number(value(params.page)) || 1);
  const { rows, total } = await getResponses(filters, requestedPage);
  const totalPages = Math.max(1, Math.ceil(total / 25));
  const currentPage = Math.min(requestedPage, totalPages);
  const query = new URLSearchParams(Object.entries(filters).filter(([, item]) => item));
  const exportQuery = query.toString() ? `?${query.toString()}` : "";
  return <div className="admin-page">
    <div className="admin-page-heading"><div><p className="admin-eyebrow">Gestión</p><h1>Respuestas</h1><p className="admin-subtitle">Revisa y actualiza cada confirmación recibida.</p></div><div className="admin-actions"><Link className="admin-button admin-button--primary" href={"/admin/responses/new" as never}>Agregar respuesta</Link><Link className="admin-button admin-button--secondary" href={`/api/admin/responses/export${exportQuery}` as never}>{exportQuery ? "Exportar filtrados" : "Exportar todo"}</Link></div></div>
    <section className="admin-section admin-section--filters"><ResponseFilters initial={filters} /></section>
    <section className="admin-section"><div className="admin-section-heading"><div><p className="admin-eyebrow">{total} resultados</p><h2>Registro de confirmaciones</h2></div></div>
      {rows.length ? <div className="responses-table-wrap"><table className="responses-table"><thead><tr><th>Nombre completo</th><th>Viernes</th><th>Sábado</th><th>Domingo</th><th>Comentario</th><th>Fecha</th><th>Acciones</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td data-label="Nombre"><strong>{row.fullName}</strong></td><td data-label="Viernes"><span className={`status-badge ${row.attendsFriday ? "status-badge--yes" : "status-badge--no"}`}>{row.attendsFriday ? "Sí" : "No"}</span></td><td data-label="Sábado"><span className={`status-badge ${row.attendsSaturday ? "status-badge--yes" : "status-badge--no"}`}>{row.attendsSaturday ? "Sí" : "No"}</span></td><td data-label="Domingo"><span className={`status-badge ${row.attendsSunday ? "status-badge--yes" : "status-badge--no"}`}>{row.attendsSunday ? "Sí" : "No"}</span></td><td data-label="Comentario" className="response-comment">{row.comment || "—"}</td><td data-label="Fecha" className="response-date">{formatDateTime(row.submittedAt)}</td><td data-label="Acciones"><Link className="admin-text-link" href={`/admin/responses/${row.id}` as never}>Ver / editar</Link></td></tr>)}</tbody></table></div> : <div className="admin-empty"><p>No se encontraron respuestas con los filtros seleccionados.</p><Link href={"/admin/responses/new" as never}>Agregar una respuesta →</Link></div>}
      {total > 25 && <div className="pagination"><span>Página {currentPage} de {totalPages}</span><div>{currentPage > 1 && <Link className="admin-button admin-button--secondary" href={`/admin/responses?${query.toString()}${query.toString() ? "&" : ""}page=${currentPage - 1}` as never}>Anterior</Link>}{currentPage < totalPages && <Link className="admin-button admin-button--secondary" href={`/admin/responses?${query.toString()}${query.toString() ? "&" : ""}page=${currentPage + 1}` as never}>Siguiente</Link>}</div></div>}
    </section>
  </div>;
}
import Link from "next/link";
