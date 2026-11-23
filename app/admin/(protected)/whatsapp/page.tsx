import { currentOrigin } from "@/src/lib/current-origin";
import { getInvitationGuests, getSettings } from "@/src/db/queries";
import { GeneralInvitationLinks } from "@/src/components/admin/invitation-link-actions";
import { ManualInvitationGuestForm } from "@/src/components/admin/manual-invitation-guest-form";
import { WhatsappImportForm } from "@/src/components/admin/whatsapp-import-form";
import { WhatsappGuestList } from "@/src/components/admin/whatsapp-guest-list";

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
    {rows.length ? <WhatsappGuestList initialGuests={rows} origin={origin} defaultMessage={settings.defaultWhatsappMessage} /> : <section className="admin-section"><div className="admin-empty"><p>Aún no hay invitados importados.</p><span>Importa tu Excel para crear enlaces personales.</span></div></section>}
  </div>;
}
