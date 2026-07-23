import { getWhatsappDashboard } from "@/src/db/queries";
import { formatDateTime } from "@/src/lib/dates";
import { WhatsappImportForm } from "@/src/components/admin/whatsapp-import-form";
import { WhatsappRetryButton } from "@/src/components/admin/whatsapp-retry-button";

const statusLabel: Record<string, string> = { queued: "En cola", sending: "Enviando", sent: "Enviado", delivered: "Entregado", read: "Leído", failed: "Falló" };

export default async function WhatsappPage() {
  const { rows, stats } = await getWhatsappDashboard();
  return <div className="admin-page whatsapp-page">
    <div className="admin-page-heading"><div><p className="admin-eyebrow">Invitaciones personales</p><h1>WhatsApp</h1><p className="admin-subtitle">Cada invitación usa un enlace único, registra su apertura y completa el nombre automáticamente.</p></div></div>
    <section className="admin-stats-grid" aria-label="Estado de WhatsApp">
      {[["Invitados", stats.total], ["En cola", stats.queued], ["Enviados", stats.sent], ["Entregados", stats.delivered], ["Abrieron enlace", stats.opened], ["Fallidos", stats.failed]].map(([label, value]) => <div className="admin-stat" key={String(label)}><span>{label}</span><strong>{value}</strong></div>)}
    </section>
    <WhatsappImportForm />
    <section className="admin-section"><div className="admin-section-heading"><div><p className="admin-eyebrow">Seguimiento</p><h2>Estado por invitado</h2></div></div>
      {rows.length ? <div className="whatsapp-table-wrap"><table className="responses-table whatsapp-table"><thead><tr><th>Invitado</th><th>Invitación</th><th>WhatsApp</th><th>Abrió enlace</th><th>Detalle</th></tr></thead><tbody>
        {rows.map(({ guest, message }) => <tr key={guest.id}><td data-label="Invitado"><strong>{guest.name}</strong><span>{guest.phoneNumber}</span></td><td data-label="Invitación">{guest.saturdayOnly ? "Solo sábado" : "Fin de semana"}</td><td data-label="WhatsApp"><span className={`status-badge status-badge--${message?.status ?? "queued"}`}>{statusLabel[message?.status ?? "queued"]}</span></td><td data-label="Abrió enlace">{guest.invitationOpenedAt ? formatDateTime(guest.invitationOpenedAt) : "—"}</td><td data-label="Detalle">{message?.status === "failed" ? <div className="whatsapp-failure"><span>{message.errorMessage || "Error desconocido"}</span><WhatsappRetryButton messageId={message.id} /></div> : message?.sentAt ? formatDateTime(message.sentAt) : "—"}</td></tr>)}
      </tbody></table></div> : <div className="admin-empty"><p>Aún no hay invitados en la cola.</p><span>Importa tu Excel para crear invitaciones personales.</span></div>}
    </section>
  </div>;
}
