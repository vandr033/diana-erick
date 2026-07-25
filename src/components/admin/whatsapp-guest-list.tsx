"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/src/components/admin/invitation-link-actions";
import { formatDateTime } from "@/src/lib/dates";
import { invitationUrl, renderInvitationMessage } from "@/src/lib/invitation-links";

type Guest = {
  id: string;
  name: string;
  phoneNumber: string | null;
  token: string;
  saturdayOnly: boolean;
  customMessage: string | null;
  whatsappSentAt: Date | string | null;
  invitationOpenedAt: Date | string | null;
};

type Filters = { q: string; invitation: string; sent: string; opened: string };

function formatTimestamp(value: Date | string | null) {
  return value ? formatDateTime(new Date(value)) : "—";
}

function guestMessage(guest: Guest, origin: string, defaultMessage: string) {
  return renderInvitationMessage(guest.customMessage || defaultMessage, guest.name, invitationUrl(origin, guest.token, guest.saturdayOnly));
}

export function WhatsappGuestList({ initialGuests, origin, defaultMessage }: { initialGuests: Guest[]; origin: string; defaultMessage: string }) {
  const [guests, setGuests] = useState(initialGuests);
  const [filters, setFilters] = useState<Filters>({ q: "", invitation: "", sent: "", opened: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [composerId, setComposerId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const visibleGuests = useMemo(() => {
    const query = filters.q.trim().toLocaleLowerCase("es-BO");
    return guests.filter((guest) => {
      const matchesQuery = !query || [guest.name, guest.phoneNumber, guest.customMessage].some((value) => value?.toLocaleLowerCase("es-BO").includes(query));
      const matchesInvitation = !filters.invitation || (filters.invitation === "saturday" ? guest.saturdayOnly : !guest.saturdayOnly);
      const matchesSent = !filters.sent || (filters.sent === "sent" ? Boolean(guest.whatsappSentAt) : !guest.whatsappSentAt);
      const matchesOpened = !filters.opened || (filters.opened === "opened" ? Boolean(guest.invitationOpenedAt) : !guest.invitationOpenedAt);
      return matchesQuery && matchesInvitation && matchesSent && matchesOpened;
    });
  }, [filters, guests]);

  const updateGuest = (guest: Guest) => setGuests((current) => current.map((item) => item.id === guest.id ? guest : item));

  const markAsSent = async (guest: Guest) => {
    setSavingId(guest.id);
    try {
      const response = await fetch(`/api/admin/whatsapp/guests/${guest.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "mark-sent" }) });
      const result = await response.json() as { guest?: Guest; message?: string };
      if (!response.ok || !result.guest) throw new Error(result.message || "No pudimos actualizar el estado.");
      updateGuest(result.guest);
      setStatus(`WhatsApp abierto para ${guest.name}; quedó marcado como enviado.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No pudimos actualizar el estado.");
    } finally {
      setSavingId(null);
    }
  };

  const openWhatsapp = (guest: Guest, message: string) => {
    if (!guest.phoneNumber) return;
    window.open(`https://wa.me/${guest.phoneNumber.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    void markAsSent(guest);
  };

  const openComposer = (guest: Guest) => {
    setComposerId(guest.id);
    setDraftMessage(guestMessage(guest, origin, defaultMessage));
    setEditingId(null);
  };

  const saveGuest = async (form: HTMLFormElement, guest: Guest) => {
    const data = new FormData(form);
    setSavingId(guest.id);
    try {
      const response = await fetch(`/api/admin/whatsapp/guests/${guest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          phoneNumber: data.get("phoneNumber") || null,
          saturdayOnly: data.get("saturdayOnly") === "on",
          customMessage: data.get("customMessage") || null,
        }),
      });
      const result = await response.json() as { guest?: Guest; message?: string };
      if (!response.ok || !result.guest) throw new Error(result.message || "No pudimos guardar los cambios.");
      updateGuest(result.guest);
      setEditingId(null);
      setStatus(`Datos de ${result.guest.name} actualizados.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No pudimos guardar los cambios.");
    } finally {
      setSavingId(null);
    }
  };

  const resetFilters = () => setFilters({ q: "", invitation: "", sent: "", opened: "" });

  return <section className="admin-section whatsapp-guests">
    <div className="admin-section-heading"><div><p className="admin-eyebrow">Lista importada</p><h2>Enviar uno por uno</h2></div><p className="whatsapp-guests__count">{visibleGuests.length} de {guests.length} invitados</p></div>
    <div className="whatsapp-guest-filters" aria-label="Filtros de invitados">
      <div className="admin-field whatsapp-guest-filters__search"><label htmlFor="guest-search">Buscar</label><input id="guest-search" value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="Nombre, teléfono o mensaje" /></div>
      <div className="admin-field"><label htmlFor="guest-invitation-filter">Invitación</label><select id="guest-invitation-filter" value={filters.invitation} onChange={(event) => setFilters((current) => ({ ...current, invitation: event.target.value }))}><option value="">Todas</option><option value="weekend">Fin de semana</option><option value="saturday">Solo sábado</option></select></div>
      <div className="admin-field"><label htmlFor="guest-sent-filter">Envío</label><select id="guest-sent-filter" value={filters.sent} onChange={(event) => setFilters((current) => ({ ...current, sent: event.target.value }))}><option value="">Todos</option><option value="sent">Enviados</option><option value="pending">Pendientes</option></select></div>
      <div className="admin-field"><label htmlFor="guest-opened-filter">Enlace</label><select id="guest-opened-filter" value={filters.opened} onChange={(event) => setFilters((current) => ({ ...current, opened: event.target.value }))}><option value="">Todos</option><option value="opened">Abiertos</option><option value="not-opened">Sin abrir</option></select></div>
      <button className="admin-text-link whatsapp-guest-filters__clear" type="button" onClick={resetFilters}>LIMPIAR</button>
    </div>
    {status && <p className="whatsapp-guests__status" role="status">{status}</p>}
    {visibleGuests.length ? <div className="whatsapp-table-wrap"><table className="responses-table whatsapp-table"><thead><tr><th>Invitado</th><th>Invitación</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
      {visibleGuests.map((guest) => {
        const link = invitationUrl(origin, guest.token, guest.saturdayOnly);
        const message = guestMessage(guest, origin, defaultMessage);
        const isSaving = savingId === guest.id;
        return <tr key={guest.id}><td data-label="Invitado"><strong>{guest.name}</strong><span>{guest.phoneNumber || "Sin teléfono"}</span></td><td data-label="Invitación">{guest.saturdayOnly ? "Solo sábado" : "Fin de semana"}</td><td data-label="Estado"><div className="whatsapp-guest-statuses"><span className={guest.whatsappSentAt ? "status-badge status-badge--sent" : "status-badge"}>{guest.whatsappSentAt ? "Enviado" : "Pendiente"}</span><small>{guest.whatsappSentAt ? formatTimestamp(guest.whatsappSentAt) : "Aún no se abrió WhatsApp"}</small><span className={guest.invitationOpenedAt ? "status-badge status-badge--yes" : "status-badge"}>{guest.invitationOpenedAt ? "Enlace abierto" : "Sin abrir"}</span></div></td><td data-label="Acciones"><div className="guest-invitation-actions">
          {guest.phoneNumber && <button type="button" className="admin-button admin-button--primary" disabled={isSaving} onClick={() => openWhatsapp(guest, message)}>{guest.whatsappSentAt ? "REENVIAR POR WHATSAPP" : "ENVIAR POR WHATSAPP"}</button>}
          {guest.phoneNumber && <button type="button" className="admin-button admin-button--secondary" onClick={() => openComposer(guest)}>ENVIAR CON MENSAJE PERSONALIZADO</button>}
          <button type="button" className="admin-button admin-button--secondary" onClick={() => { setEditingId(editingId === guest.id ? null : guest.id); setComposerId(null); }}>EDITAR</button>
          <div className="guest-invitation-actions__links"><CopyButton label="OBTENER ENLACE" value={link} /><CopyButton label="LINK FIN DE SEMANA" value={invitationUrl(origin, guest.token, false)} /><CopyButton label="LINK SÁBADO" value={invitationUrl(origin, guest.token, true)} /></div>
          {composerId === guest.id && <div className="whatsapp-message-composer"><label htmlFor={`message-${guest.id}`}>Mensaje para {guest.name}</label><textarea id={`message-${guest.id}`} value={draftMessage} onChange={(event) => setDraftMessage(event.target.value)} rows={7} /><p>Este mensaje se abre listo para enviar en WhatsApp. Puedes ajustarlo sin cambiar los datos guardados.</p><div><button type="button" className="admin-button admin-button--primary" disabled={isSaving || !draftMessage.trim()} onClick={() => openWhatsapp(guest, draftMessage)}>ABRIR WHATSAPP</button><button type="button" className="admin-button admin-button--secondary" onClick={() => setComposerId(null)}>CANCELAR</button></div></div>}
          {editingId === guest.id && <form className="whatsapp-guest-edit" onSubmit={(event) => { event.preventDefault(); void saveGuest(event.currentTarget, guest); }}><div className="admin-field"><label htmlFor={`guest-name-${guest.id}`}>Nombre</label><input id={`guest-name-${guest.id}`} name="name" defaultValue={guest.name} required maxLength={150} /></div><div className="admin-field"><label htmlFor={`guest-phone-${guest.id}`}>Teléfono</label><input id={`guest-phone-${guest.id}`} name="phoneNumber" defaultValue={guest.phoneNumber || ""} inputMode="tel" placeholder="+59170000000" maxLength={24} /></div><label className="admin-toggle"><input name="saturdayOnly" type="checkbox" defaultChecked={guest.saturdayOnly} /><span>Solo sábado</span></label><div className="admin-field whatsapp-guest-edit__message"><label htmlFor={`guest-custom-message-${guest.id}`}>Mensaje guardado <em>opcional</em></label><textarea id={`guest-custom-message-${guest.id}`} name="customMessage" defaultValue={guest.customMessage || ""} rows={5} placeholder="Usa {name} y {link}, o escribe el texto completo." maxLength={2000} /></div><div className="admin-form-actions"><button type="submit" className="admin-button admin-button--primary" disabled={isSaving}>{isSaving ? "GUARDANDO…" : "GUARDAR CAMBIOS"}</button><button type="button" className="admin-button admin-button--secondary" onClick={() => setEditingId(null)}>CANCELAR</button></div></form>}
        </div></td></tr>;
      })}
    </tbody></table></div> : <div className="admin-empty"><p>No hay invitados con estos filtros.</p><button className="admin-text-link" type="button" onClick={resetFilters}>Ver toda la lista</button></div>}
  </section>;
}
