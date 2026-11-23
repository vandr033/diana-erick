import Link from "next/link";
import { GeneralInvitationLinks } from "@/src/components/admin/invitation-link-actions";
import { ManualInvitationGuestForm } from "@/src/components/admin/manual-invitation-guest-form";
import { WhatsappGuestList } from "@/src/components/admin/whatsapp-guest-list";
import { WeddingImport } from "@/src/components/admin/wedding-import";
import { getInvitationGuests, getSettings } from "@/src/db/queries";
import { currentOrigin } from "@/src/lib/current-origin";
import { getSaveTheDateResponse } from "@/src/lib/invitation-guests";

export default async function FinalInvitationsPage({ searchParams }: { searchParams: Promise<{ respuesta?: string }> }) {
  const { respuesta } = await searchParams;
  const [{ rows }, settings, origin, response] = await Promise.all([
    getInvitationGuests("final"),
    getSettings(),
    currentOrigin(),
    typeof respuesta === "string" ? getSaveTheDateResponse(respuesta) : null,
  ]);
  const source = response && respuesta ? { id: respuesta, ...response } : undefined;

  return <div className="admin-page whatsapp-page">
    <div className="admin-page-heading">
      <div>
        <p className="admin-eyebrow">Invitación final</p>
        <h1>Invitados a la boda</h1>
        <p className="admin-subtitle">Crea enlaces personales, prepara mensajes de WhatsApp y registra los envíos.</p>
      </div>
      <div className="admin-actions">
        <Link className="admin-button admin-button--secondary" href={{ pathname: "/admin/responses" }}>Invitar desde el Save the Date</Link>
        <Link className="admin-button admin-button--secondary" href={{ pathname: "/admin/responses", query: { phase: "final" } }}>Ver confirmaciones de boda</Link>
        <Link className="admin-button admin-button--secondary" href={{ pathname: "/admin/content", hash: "invitacion-final" }}>Editar contenido</Link>
      </div>
    </div>
    {respuesta && !source && <p className="admin-error" role="alert">No encontramos la respuesta del Save the Date.</p>}
    <ManualInvitationGuestForm key={source?.id ?? "new"} origin={origin} phase="final" source={source} />
    {source && <Link className="admin-text-link" href={{ pathname: "/admin/invitaciones" }}>Invitar a otra persona</Link>}
    <WeddingImport />
    <GeneralInvitationLinks origin={origin} phase="final" />
    {rows.length > 0
      ? <WhatsappGuestList key={rows.map((row) => row.id).join(",")} initialGuests={rows} origin={origin} defaultMessage={settings.defaultWhatsappMessage} phase="final" />
      : <section className="admin-section"><div className="admin-empty"><p>Todavía no hay invitados a la boda.</p></div></section>}
  </div>;
}
