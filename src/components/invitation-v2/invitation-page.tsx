import { withInvitationEventArtwork } from "@/src/components/public/invitation-event-artwork";
import { HospitalitySection } from "@/src/components/public/hospitality-section";
import { ItinerarySection } from "@/src/components/public/itinerary-section";
import { PublicFooter } from "@/src/components/public/public-footer";
import { RsvpSection } from "@/src/components/public/rsvp-section";
import { getEvents, getSettings } from "@/src/db/queries";
import type { InvitationPhase } from "@/src/db/schema";
import { formatDayMonth, formatLongDate } from "@/src/lib/dates";
import { rsvpDays } from "@/src/lib/invitation-party";
import type { RsvpConfirmation } from "@/src/lib/rsvp-server";
import { createInvitationContent } from "./invitation-content";
import { InvitationExperience } from "./invitation-experience";

export async function InvitationV2Page({ saturdayOnly = false, transportIncluded = true, initialName, invitationToken, phase = "save-the-date", companions, savedConfirmation }: { saturdayOnly?: boolean; transportIncluded?: boolean; initialName?: string; invitationToken?: string; phase?: InvitationPhase; companions?: string[]; savedConfirmation?: RsvpConfirmation }) {
  const [settings, allEvents] = await Promise.all([getSettings(), getEvents(true)]);
  const saturdayEvent = allEvents.find((event) => event.slug === "sabado");
  const visibleEvents = saturdayOnly ? allEvents.filter((event) => event.slug === "sabado") : allEvents;
  const invitationEvents = withInvitationEventArtwork(visibleEvents);
  const targetEvent = saturdayOnly ? saturdayEvent || visibleEvents[0] : visibleEvents[0];
  const content = createInvitationContent(settings, {
    ...(saturdayOnly && saturdayEvent && {
      dateLabel: formatDayMonth(saturdayEvent.date),
      yearLabel: saturdayEvent.date.slice(0, 4),
      introduction: `Te invitamos a compartir con nosotros\nen nuestra boda el ${formatLongDate(saturdayEvent.date)}`,
      discoverLabel: "Descubrir la celebración",
    }),
    recipientName: initialName,
    phase,
  });

  return (
    <InvitationExperience content={content} transportDays={phase === "final"
      ? transportIncluded ? rsvpDays.filter(({ slug }) => visibleEvents.some((event) => event.slug === slug)) : []
      : undefined}>
      <ItinerarySection events={invitationEvents} />
      {!saturdayOnly && <HospitalitySection settings={settings} events={phase === "final" ? visibleEvents : undefined} showTransport={phase !== "final" || transportIncluded} />}
      {phase === "final" && settings.finalInvitationDetails && (
        <section className="rsvp-section rsvp-section--details" aria-labelledby="final-invitation-details">
          <div className="rsvp-shell">
            <h2 id="final-invitation-details">Detalles de la boda</h2>
            <div className="rsvp-rule" />
            <p className="final-invitation-details">{settings.finalInvitationDetails}</p>
          </div>
        </section>
      )}
      <RsvpSection settings={settings} events={visibleEvents} saturdayOnly={saturdayOnly} transportIncluded={phase !== "final" || transportIncluded} initialName={initialName} invitationToken={invitationToken}
        phase={phase} companions={companions} savedConfirmation={savedConfirmation}
        countdownEvent={targetEvent} />
      <PublicFooter settings={settings} />
    </InvitationExperience>
  );
}
