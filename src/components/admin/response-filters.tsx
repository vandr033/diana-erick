"use client";

import { useState } from "react";
import Link from "next/link";

export function ResponseFilters({ initial }: { initial: Record<string, string> }) {
  const [filters, setFilters] = useState(initial);
  const update = (key: string, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  return <form className="response-filters" method="get">
    <div className="admin-field"><label htmlFor="filter-q">Buscar por nombre</label><input id="filter-q" name="q" value={filters.q || ""} onChange={(event) => update("q", event.target.value)} placeholder="Ej. Diana" /></div>
    <div className="admin-field"><label htmlFor="filter-event">Evento</label><select id="filter-event" name="event" value={filters.event || ""} onChange={(event) => update("event", event.target.value)}><option value="">Todos</option><option value="viernes">Viernes</option><option value="sabado">Sábado</option><option value="domingo">Domingo</option></select></div>
    <div className="admin-field"><label htmlFor="filter-attendance">Asistencia</label><select id="filter-attendance" name="attendance" value={filters.attendance || ""} onChange={(event) => update("attendance", event.target.value)}><option value="">Todas</option><option value="si">Asiste</option><option value="tal-vez">Tal vez</option><option value="no">No asiste</option></select></div>
    <div className="admin-field"><label htmlFor="filter-from">Desde</label><input id="filter-from" name="dateFrom" type="date" value={filters.dateFrom || ""} onChange={(event) => update("dateFrom", event.target.value)} /></div>
    <div className="admin-field"><label htmlFor="filter-to">Hasta</label><input id="filter-to" name="dateTo" type="date" value={filters.dateTo || ""} onChange={(event) => update("dateTo", event.target.value)} /></div>
    <div className="response-filters__actions"><button className="admin-button admin-button--primary" type="submit">Aplicar filtros</button><Link className="admin-text-link" href={"/admin/responses" as never}>Limpiar</Link></div>
  </form>;
}
