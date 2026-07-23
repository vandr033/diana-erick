"use client";

import { useState } from "react";
import { CopyButton } from "@/src/components/admin/invitation-link-actions";
import { invitationUrl } from "@/src/lib/invitation-links";

type CreatedGuest = { name: string; token: string; saturdayOnly: boolean; phoneNumber: string | null };

export function ManualInvitationGuestForm({ origin }: { origin: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createdGuest, setCreatedGuest] = useState<CreatedGuest | null>(null);

  const submit = async (form: HTMLFormElement) => {
    const formData = new FormData(form);
    setIsSubmitting(true);
    setMessage(null);
    setCreatedGuest(null);
    try {
      const response = await fetch("/api/admin/whatsapp/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          prefix: formData.get("prefix"),
          phoneNumber: formData.get("phoneNumber"),
          saturdayOnly: formData.get("saturdayOnly") === "on",
        }),
      });
      const result = await response.json() as { guest?: CreatedGuest; message?: string };
      if (!response.ok || !result.guest) throw new Error(result.message || "No fue posible crear la invitación.");
      setCreatedGuest(result.guest);
      form.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible crear la invitación.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const link = createdGuest ? invitationUrl(origin, createdGuest.token, createdGuest.saturdayOnly) : null;
  return <section className="admin-section manual-invitation-guest">
    <div className="admin-section-heading"><div><p className="admin-eyebrow">Una persona</p><h2>Invitar persona</h2></div></div>
    <p className="admin-note">Crea un enlace personal sin importar un Excel. El prefijo y el teléfono son opcionales, pero deben completarse juntos si quieres abrir WhatsApp Web.</p>
    <form className="manual-invitation-guest__form" onSubmit={(event) => { event.preventDefault(); void submit(event.currentTarget); }}>
      <div className="admin-field admin-field--wide"><label htmlFor="manual-guest-name">Nombre</label><input id="manual-guest-name" name="name" required maxLength={150} autoComplete="name" placeholder="Nombre de la persona" /></div>
      <div className="admin-field"><label htmlFor="manual-guest-prefix">Prefijo <em>opcional</em></label><input id="manual-guest-prefix" name="prefix" inputMode="tel" maxLength={8} placeholder="+591" /></div>
      <div className="admin-field"><label htmlFor="manual-guest-phone">Teléfono <em>opcional</em></label><input id="manual-guest-phone" name="phoneNumber" inputMode="tel" maxLength={24} placeholder="70000000" /></div>
      <label className="manual-invitation-guest__toggle"><input name="saturdayOnly" type="checkbox" /><span>Solo invitado sábado</span></label>
      <button className="admin-button admin-button--primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "CREANDO…" : "CREAR ENLACE"}</button>
    </form>
    {message && <p className="admin-error manual-invitation-guest__status" role="alert">{message}</p>}
    {link && <div className="manual-invitation-guest__result" role="status"><p><strong>Enlace listo para {createdGuest?.name}.</strong> {createdGuest?.phoneNumber ? "También puedes enviarlo desde su fila en WhatsApp." : "Cópialo para enviarlo por el canal que prefieras."}</p><input aria-label={`Enlace de ${createdGuest?.name}`} readOnly value={link} /><CopyButton label="COPIAR ENLACE" value={link} /></div>}
  </section>;
}
