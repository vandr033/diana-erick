import type { Event, InvitationPhase, SiteSettings } from "@/src/db/schema";
import type { RsvpConfirmation } from "@/src/lib/rsvp-server";
import { RsvpForm } from "./rsvp-form";

export function RsvpSection({ settings, events, saturdayOnly = false, initialName, invitationToken, phase, companions, savedConfirmation, afterRsvp }: { settings: SiteSettings; events: Event[]; saturdayOnly?: boolean; initialName?: string; invitationToken?: string; phase?: InvitationPhase; companions?: string[]; savedConfirmation?: RsvpConfirmation; afterRsvp?: ReactNode }) {
  const { attendancePromptLabel, commentLabel, confirmationMessage, confirmationTitle, fullNameLabel, submitButtonLabel, rsvpTitle, rsvpClosedMessage } = settings;
  const formSettings = { attendancePromptLabel, commentLabel, confirmationMessage, confirmationTitle, fullNameLabel, submitButtonLabel, rsvpTitle, rsvpClosedMessage };
  return <RsvpForm settings={formSettings} events={events} endpoint={saturdayOnly ? "/api/rsvp/sabado" : "/api/rsvp"}
    initialFullName={initialName} invitationToken={invitationToken} phase={phase} companions={companions} savedConfirmation={savedConfirmation}
    canEdit={settings.rsvpEnabled} afterRsvp={afterRsvp} />;
}
import type { ReactNode } from "react";
