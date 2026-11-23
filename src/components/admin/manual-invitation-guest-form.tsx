"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InvitationPhase } from "@/src/db/schema";
import { CopyButton } from "@/src/components/admin/invitation-link-actions";
import { invitationUrl } from "@/src/lib/invitation-links";
import { CompanionFields } from "./companion-fields";

type CreatedGuest = { name: string; token: string; saturdayOnly: boolean; phoneNumber: string | null };
type RsvpGuest = { id: string; fullName: string; phoneNumber: string | null; saturdayOnly: boolean | null };

export function ManualInvitationGuestForm({ origin, phase = "save-the-date", source }: { origin: string; phase?: InvitationPhase; source?: RsvpGuest }) {
  const router = useRouter();
  const isFinal = phase === "final";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createdGuest, setCreatedGuest] = useState<CreatedGuest | null>(null);
  const [formVersion, setFormVersion] = useState(0);

  const submit = async (form: HTMLFormElement) => {
    const formData = new FormData(form);
    setIsSubmitting(true);
    setMessage(null);
    setCreatedGuest(null);
    try {
      const response = await fetch(`/api/admin/whatsapp/guests${isFinal ? "?phase=final" : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          prefix: formData.get("prefix"),
          phoneNumber: formData.get("phoneNumber"),
          saturdayOnly: isFinal ? formData.get("scope") === "saturday" : formData.get("saturdayOnly") === "on",
          sourceResponseId: source?.id,
          companions: isFinal ? formData.getAll("companionName") : undefined,
        }),
      });
      const result = await response.json() as { guest?: CreatedGuest; message?: string };
      if (!response.ok || !result.guest) throw new Error(result.message || "No fue posible crear la invitación.");
      setCreatedGuest(result.guest);
      form.reset();
      if (isFinal) {
        setFormVersion((previous) => previous + 1);
        router.refresh();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible crear la invitación.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const link = createdGuest ? invitationUrl(origin, createdGuest.token, createdGuest.saturdayOnly, phase) : null;
  return <section className="admin-section manual-invitation-guest">
    <div className="admin-section-heading"><div><h2>{source ? "Invitar desde una respuesta" : "Invitar persona"}</h2></div></div>
    <p className="admin-note">{source?.phoneNumber
      ? `Se usará el teléfono ${source.phoneNumber} del Save the Date. Completa ambos campos para usar otro número.`
      : "El prefijo y el teléfono son opcionales. Completa ambos si vas a enviar por WhatsApp."}</p>
    <form className="manual-invitation-guest__form" onSubmit={(event) => { event.preventDefault(); void submit(event.currentTarget); }}>
      <div className="admin-field admin-field--wide"><label htmlFor="manual-guest-name">Nombre</label><input id="manual-guest-name" name="name" defaultValue={source?.fullName} required maxLength={150} autoComplete="name" placeholder="Nombre de la persona" /></div>
      <div className="admin-field"><label htmlFor="manual-guest-prefix">Prefijo <em>opcional</em></label><input id="manual-guest-prefix" name="prefix" inputMode="tel" maxLength={8} placeholder="+591" /></div>
      <div className="admin-field"><label htmlFor="manual-guest-phone">Teléfono <em>opcional</em></label><input id="manual-guest-phone" name="phoneNumber" inputMode="tel" maxLength={24} placeholder="70000000" /></div>
      {isFinal ? <div className="admin-field">
        <label htmlFor="manual-guest-scope">Eventos incluidos</label>
        <select id="manual-guest-scope" name="scope" defaultValue={source?.saturdayOnly == null ? "" : source.saturdayOnly ? "saturday" : "weekend"} required>
          <option value="" disabled>Selecciona los eventos</option>
          <option value="weekend">Fin de semana</option>
          <option value="saturday">Solo sábado</option>
        </select>
      </div> : <label className="manual-invitation-guest__toggle"><input name="saturdayOnly" type="checkbox" /><span>Solo invitado sábado</span></label>}
      {isFinal && <CompanionFields key={formVersion} />}
      <button className="admin-button admin-button--primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "CREANDO…" : "CREAR ENLACE"}</button>
    </form>
    {message && <p className="admin-error manual-invitation-guest__status" role="alert">{message}</p>}
    {link && <div className="manual-invitation-guest__result" role="status"><p><strong>Enlace listo para {createdGuest?.name}.</strong> {createdGuest?.phoneNumber ? "También puedes enviarlo desde su fila en WhatsApp." : "Cópialo para enviarlo por el canal que prefieras."}</p><input aria-label={`Enlace de ${createdGuest?.name}`} readOnly value={link} /><CopyButton label="COPIAR ENLACE" value={link} /></div>}
  </section>;
}
