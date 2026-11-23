import { attendanceCount } from "@/src/lib/invitation-party";
import { getResponses } from "@/src/db/queries";
import { formatDateTime } from "@/src/lib/dates";
import { ResponseFilters } from "@/src/components/admin/response-filters";
import { DeleteResponseButton } from "@/src/components/admin/delete-response-button";
import type { Attendance, RsvpResponse } from "@/src/db/schema";
import { describeFoodFeedback } from "@/src/lib/rsvp-feedback";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const value = (item: string | string[] | undefined) => Array.isArray(item) ? item[0] || "" : item || "";
const attendanceLabel: Record<Attendance, string> = { yes: "Sí", maybe: "Tal vez", no: "No" };
const feedbackSections = {
  comida: {
    label: "Comida",
    columns: ["Restricciones", "Detalles"],
    cells: ({ foodFeedback }: RsvpResponse) => {
      const food = foodFeedback ? describeFoodFeedback(foodFeedback) : null;
      return [food?.answer, food?.details];
    },
  },
  musica: {
    label: "Música",
    columns: ["Canción y artista"],
    cells: ({ musicFeedback }: RsvpResponse) => [musicFeedback?.song],
  },
  vuelos: {
    label: "Vuelos",
    columns: ["Llegada a SCZ", "Salida de SCZ", "Comentarios"],
    cells: ({ flightFeedback }: RsvpResponse) => [
      flightFeedback?.arrival.replace("T", " "), flightFeedback?.departure?.replace("T", " "), flightFeedback?.notes,
    ],
  },
};

export default async function ResponsesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const isFinal = value(params.phase) === "final";
  const selectedSection = value(params.section);
  const section = isFinal && Object.hasOwn(feedbackSections, selectedSection) ? selectedSection as keyof typeof feedbackSections : "";
  const feedbackSection = section ? feedbackSections[section] : null;
  const exportFilters = { phase: isFinal ? "final" : "", q: value(params.q), event: value(params.event), attendance: value(params.attendance), dateFrom: value(params.dateFrom), dateTo: value(params.dateTo) };
  const filters = { ...exportFilters, section };
  const requestedPage = Math.max(1, Number(value(params.page)) || 1);
  const { rows, total, transport } = await getResponses(filters, requestedPage);
  const totalPages = Math.max(1, Math.ceil(total / 25));
  const currentPage = Math.min(requestedPage, totalPages);
  const query = new URLSearchParams(Object.entries(filters).filter(([, item]) => item));
  const exportParams = Object.fromEntries(Object.entries(exportFilters).filter(([, item]) => item));
  const exportQuery = Object.keys(exportParams).length ? `?${new URLSearchParams(exportParams)}` : "";
  return <div className="admin-page">
    <div className="admin-page-heading"><div><p className="admin-eyebrow">Gestión</p><h1>{isFinal ? "Confirmaciones de boda" : "Respuestas al Save the Date"}</h1><p className="admin-subtitle">Revisa y actualiza cada confirmación recibida.</p></div><div className="admin-actions">{!isFinal && <Link className="admin-button admin-button--primary" href={{ pathname: "/admin/responses/new" }}>Agregar respuesta</Link>}<Link className="admin-button admin-button--secondary" href={`/api/admin/responses/export${exportQuery}` as never}>Exportar Excel</Link></div></div>
    <nav className="admin-actions" aria-label="Tipo de respuesta">
      <Link className="admin-button admin-button--secondary" aria-current={!isFinal ? "page" : undefined} href={{ pathname: "/admin/responses" }}>Save the Date</Link>
      <Link className="admin-button admin-button--secondary" aria-current={isFinal ? "page" : undefined} href={{ pathname: "/admin/responses", query: { phase: "final" } }}>Invitación final</Link>
    </nav>
    {isFinal && <nav className="admin-actions" aria-label="Secciones de confirmaciones">
      <Link className={`admin-button admin-button--${!section ? "primary" : "secondary"}`} aria-current={!section ? "page" : undefined}
        href={{ pathname: "/admin/responses", query: exportParams }}>Resumen</Link>
      {Object.entries(feedbackSections).map(([key, { label }]) =>
        <Link key={key} className={`admin-button admin-button--${section === key ? "primary" : "secondary"}`} aria-current={section === key ? "page" : undefined}
          href={{ pathname: "/admin/responses", query: { ...exportParams, section: key } }}>{label}</Link>)}
    </nav>}
    <section className="admin-section admin-section--filters"><ResponseFilters key={`${filters.phase}:${section}`} initial={filters} /></section>
    {transport && <section className="admin-section" aria-labelledby="transport-metrics">
      <div className="admin-section-heading"><div><h2 id="transport-metrics">Personas que necesitan transporte</h2></div></div>
      <div className="admin-stats-grid">{transport.map(({ slug, label, count }) =>
        <div className="admin-stat" key={slug}><span>{label}</span><strong>{count}</strong></div>)}</div>
    </section>}
    <section className="admin-section"><div className="admin-section-heading"><div><p className="admin-eyebrow">{total} resultados</p><h2>{feedbackSection?.label ?? "Registro de confirmaciones"}</h2></div></div>
      {rows.length && feedbackSection ? <div className="responses-table-wrap"><table className="responses-table">
        <thead><tr><th>Nombre completo</th>{feedbackSection.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id}>
          <td data-label="Nombre"><Link href={`/admin/responses/${row.id}`} className="admin-text-link">{row.fullName}</Link></td>
          {feedbackSection.cells(row).map((cell, index) => <td className="response-comment" data-label={feedbackSection.columns[index]} key={feedbackSection.columns[index]}>{cell || "—"}</td>)}
        </tr>)}</tbody>
      </table></div> : rows.length ? <div className="responses-table-wrap"><table className="responses-table"><thead><tr><th>Nombre completo</th><th>Viernes</th><th>Sábado</th><th>Domingo</th><th>Comentario</th><th>Fecha</th><th>Acciones</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td data-label="Nombre"><strong>{row.fullName}</strong></td>{(["attendsFriday", "attendsSaturday", "attendsSunday"] as const).map((key, index) => <td data-label={["Viernes", "Sábado", "Domingo"][index]} key={key}><span className={`status-badge status-badge--${row[key]}`}>{row.party && row[key] === "yes" ? `${attendanceCount(row, key)} asisten` : attendanceLabel[row[key]]}</span></td>)}<td data-label="Comentario" className="response-comment">{row.comment || "—"}</td><td data-label="Fecha" className="response-date">{formatDateTime(row.submittedAt)}</td><td data-label="Acciones"><div className="admin-actions"><Link className="admin-text-link" href={`/admin/responses/${row.id}` as never}>Ver / editar</Link>{!isFinal && <Link className="admin-text-link" href={{ pathname: "/admin/invitaciones", query: { respuesta: row.id } }}>Invitar a la boda</Link>}<DeleteResponseButton id={row.id} reloadAfterDelete /></div></td></tr>)}</tbody></table></div> : <div className="admin-empty"><p>No se encontraron respuestas con los filtros seleccionados.</p>{!isFinal && <Link href={{ pathname: "/admin/responses/new" }}>Agregar una respuesta</Link>}</div>}
      {total > 25 && <div className="pagination"><span>Página {currentPage} de {totalPages}</span><div>{currentPage > 1 && <Link className="admin-button admin-button--secondary" href={`/admin/responses?${query.toString()}${query.toString() ? "&" : ""}page=${currentPage - 1}` as never}>Anterior</Link>}{currentPage < totalPages && <Link className="admin-button admin-button--secondary" href={`/admin/responses?${query.toString()}${query.toString() ? "&" : ""}page=${currentPage + 1}` as never}>Siguiente</Link>}</div></div>}
    </section>
  </div>;
}
import Link from "next/link";
