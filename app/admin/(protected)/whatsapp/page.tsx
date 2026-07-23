import { headers } from "next/headers";
import { getInvitationGuests, getSettings } from "@/src/db/queries";
import { formatDateTime } from "@/src/lib/dates";
import { GeneralInvitationLinks, GuestInvitationActions } from "@/src/components/admin/invitation-link-actions";
import { ManualInvitationGuestForm } from "@/src/components/admin/manual-invitation-guest-form";
import { WhatsappImportForm } from "@/src/components/admin/whatsapp-import-form";

async function currentOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || "https";
  return `${protocol}://${host}`;
}

export default async function WhatsappPage() {
  const [{ rows, stats }, settings, origin] = await Promise.all([getInvitationGuests(), getSettings(), currentOrigin()]);
  return <div className="admin-page whatsapp-page">
    <div className="admin-page-heading"><div><p className="admin-eyebrow">Invitaciones personales</p><h1>Invitados</h1><p className="admin-subtitle">Importa tu lista, abre WhatsApp Web para cada persona y comparte enlaces con o sin nombre.</p></div></div>
    <section className="admin-stats-grid" aria-label="Resumen de invitados">
      {[["Invitados", stats.total], ["Solo sábado", stats.saturdayOnly], ["Abrieron enlace", stats.opened]].map(([label, value]) => <div className="admin-stat" key={String(label)}><span>{label}</span><strong>{value}</strong></div>)}
    </section>
    <GeneralInvitationLinks origin={origin} />
    <ManualInvitationGuestForm origin={origin} />
    <WhatsappImportForm />
    <section className="admin-section"><div className="admin-section-heading"><div><p className="admin-eyebrow">Lista importada</p><h2>Enviar uno por uno</h2></div></div>
      {rows.length ? <div className="whatsapp-table-wrap"><table className="responses-table whatsapp-table"><thead><tr><th>Invitado</th><th>Invitación</th><th>Abrió enlace</th><th>Acciones</th></tr></thead><tbody>
        {rows.map((guest) => <tr key={guest.id}><td data-label="Invitado"><strong>{guest.name}</strong><span>{guest.phoneNumber || "Sin teléfono"}</span></td><td data-label="Invitación">{guest.saturdayOnly ? "Solo sábado" : "Fin de semana"}</td><td data-label="Abrió enlace">{guest.invitationOpenedAt ? formatDateTime(guest.invitationOpenedAt) : "—"}</td><td data-label="Acciones"><GuestInvitationActions guest={guest} origin={origin} defaultMessage={settings.defaultWhatsappMessage} /></td></tr>)}
      </tbody></table></div> : <div className="admin-empty"><p>Aún no hay invitados importados.</p><span>Importa tu Excel para crear enlaces personales.</span></div>}
    </section>
  </div>;
}
