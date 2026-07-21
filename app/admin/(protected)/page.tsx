import Link from "next/link";
import { getDashboardStats } from "@/src/db/queries";
import { formatDateTime } from "@/src/lib/dates";
import type { Attendance } from "@/src/db/schema";

const cards = [
  ["total", "Total de respuestas"],
  ["confirmations", "Confirmaciones"],
  ["friday", "Asisten el viernes"],
  ["saturday", "Asisten el sábado"],
  ["sunday", "Asisten el domingo"],
  ["none", "No asisten a ningún evento"],
] as const;

const attendanceShortLabel: Record<Attendance, string> = { yes: "Sí", maybe: "Tal", no: "No" };

function AttendanceSummary({ row }: { row: { attendsFriday: Attendance; attendsSaturday: Attendance; attendsSunday: Attendance } }) {
  const item = (day: string, value: Attendance) => <span className={`is-${value}`} key={day}>{day} {attendanceShortLabel[value]}</span>;
  return <div className="admin-attendance-summary">{item("V", row.attendsFriday)}{item("S", row.attendsSaturday)}{item("D", row.attendsSunday)}</div>;
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><p className="admin-eyebrow">Resumen</p><h1>Hola, aquí está todo</h1><p className="admin-subtitle">Estas cifras representan respuestas enviadas, no necesariamente personas.</p></div><div className="admin-actions"><Link className="admin-button admin-button--primary" href={"/admin/responses/new" as never}>Agregar respuesta</Link><Link className="admin-button admin-button--secondary" href={"/api/admin/responses/export" as never}>Exportar Excel</Link></div></div>
      <section className="admin-stats-grid" aria-label="Resumen de respuestas">
        {cards.map(([key, label]) => <div className="admin-stat" key={key}><span>{label}</span><strong>{stats[key]}</strong></div>)}
      </section>
      <section className="admin-section"><div className="admin-section-heading"><div><p className="admin-eyebrow">Actividad reciente</p><h2>Respuestas recientes</h2></div><Link className="admin-text-link" href={"/admin/responses" as never}>Ver todas →</Link></div>
        {stats.recent.length ? <div className="admin-recent-list">{stats.recent.map((row) => <Link className="admin-recent-row" href={`/admin/responses/${row.id}` as never} key={row.id}><div><strong>{row.fullName}</strong><span>{formatDateTime(row.submittedAt)}</span></div><AttendanceSummary row={row} /><span className="admin-arrow">→</span></Link>)}</div> : <div className="admin-empty"><p>Aún no hay respuestas.</p><Link href={"/admin/responses/new" as never}>Agregar la primera respuesta →</Link></div>}
      </section>
    </div>
  );
}
