import type { Event, SiteSettings } from "@/src/db/schema";
import { RsvpForm } from "./rsvp-form";

export function RsvpSection({ settings, events, saturdayOnly = false }: { settings: SiteSettings; events: Event[]; saturdayOnly?: boolean }) {
  return (
    <section id="confirmar" className="rsvp-section" aria-labelledby="rsvp-title">
      <div className="rsvp-shell">
        <p className="eyebrow">Una pequeña confirmación</p>
        <h2 id="rsvp-title">{settings.rsvpTitle}</h2>
        <div className="rsvp-rule" />
        {settings.rsvpEnabled ? <RsvpForm settings={settings} events={events} endpoint={saturdayOnly ? "/api/rsvp/sabado" : "/api/rsvp"} /> : <div className="rsvp-closed" role="status">{settings.rsvpClosedMessage}</div>}
      </div>
    </section>
  );
}
