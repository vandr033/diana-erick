import type { Event, InvitationPhase, SiteSettings } from "@/src/db/schema";
import type { RsvpConfirmation } from "@/src/lib/rsvp-server";
import { RsvpForm } from "./rsvp-form";

export function RsvpSection({ settings, events, saturdayOnly = false, initialName, invitationToken, phase, companions, savedConfirmation }: { settings: SiteSettings; events: Event[]; saturdayOnly?: boolean; initialName?: string; invitationToken?: string; phase?: InvitationPhase; companions?: string[]; savedConfirmation?: RsvpConfirmation }) {
  const { attendancePromptLabel, commentLabel, confirmationMessage, confirmationTitle, fullNameLabel, submitButtonLabel } = settings;
  const formSettings = { attendancePromptLabel, commentLabel, confirmationMessage, confirmationTitle, fullNameLabel, submitButtonLabel };
  return (
    <section id="confirmar" className="rsvp-section" aria-labelledby="rsvp-title">
      <div className="rsvp-shell">
        <p className="eyebrow">Una pequeña confirmación</p>
        <h2 id="rsvp-title">{settings.rsvpTitle}</h2>
        <div className="rsvp-rule" />
        {settings.rsvpEnabled || savedConfirmation ? <RsvpForm settings={formSettings} events={events} endpoint={saturdayOnly ? "/api/rsvp/sabado" : "/api/rsvp"}
          initialFullName={initialName} invitationToken={invitationToken} phase={phase} companions={companions} savedConfirmation={savedConfirmation}
          canEdit={settings.rsvpEnabled} /> : <div className="rsvp-closed" role="status">{settings.rsvpClosedMessage}</div>}
      </div>
    </section>
  );
}
