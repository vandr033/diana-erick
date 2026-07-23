"use client";

import { useState } from "react";
import { invitationUrl, renderInvitationMessage } from "@/src/lib/invitation-links";

function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_800);
  };
  return <button type="button" className="admin-button admin-button--secondary invitation-link-button" onClick={() => void copy()}>{copied ? "COPIADO" : label}</button>;
}

export function GeneralInvitationLinks({ origin }: { origin: string }) {
  return <section className="admin-section invitation-links">
    <div className="admin-section-heading"><div><p className="admin-eyebrow">Enlaces públicos</p><h2>Obtener enlace</h2></div></div>
    <p className="admin-note">Estos enlaces no incluyen un nombre. Úsalos cuando quieras compartir la invitación abierta.</p>
    <div className="invitation-links__actions"><CopyButton label="COPIAR FIN DE SEMANA" value={`${origin}/`} /><CopyButton label="COPIAR SOLO SÁBADO" value={`${origin}/sabado`} /></div>
  </section>;
}

export function GuestInvitationActions({ guest, origin, defaultMessage }: { guest: { name: string; phoneNumber: string; token: string; saturdayOnly: boolean; customMessage: string | null }; origin: string; defaultMessage: string }) {
  const preferredLink = invitationUrl(origin, guest.token, guest.saturdayOnly);
  const message = renderInvitationMessage(guest.customMessage || defaultMessage, guest.name, preferredLink);
  const whatsappUrl = `https://wa.me/${guest.phoneNumber.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
  const allWeekendLink = invitationUrl(origin, guest.token, false);
  const saturdayLink = invitationUrl(origin, guest.token, true);
  return <div className="guest-invitation-actions">
    <a className="admin-button admin-button--primary" href={whatsappUrl} target="_blank" rel="noreferrer">ENVIAR POR WHATSAPP</a>
    <div className="guest-invitation-actions__links"><CopyButton label="LINK FIN DE SEMANA" value={allWeekendLink} /><CopyButton label="LINK SÁBADO" value={saturdayLink} /></div>
  </div>;
}
