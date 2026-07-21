import { DeadlineSection } from "@/src/components/public/deadline-section";
import { withInvitationEventArtwork } from "@/src/components/public/invitation-event-artwork";
import { ItinerarySection } from "@/src/components/public/itinerary-section";
import { PublicFooter } from "@/src/components/public/public-footer";
import { RsvpSection } from "@/src/components/public/rsvp-section";
import { getEvents, getSettings } from "@/src/db/queries";
import { formatDayMonth, formatLongDate } from "@/src/lib/dates";
import { createInvitationContent } from "./invitation-content";
import { InvitationExperience } from "./invitation-experience";

export async function InvitationV2Page({ saturdayOnly = false }: { saturdayOnly?: boolean }) {
  const [settings, allEvents] = await Promise.all([getSettings(), getEvents(true)]);
  const saturdayEvent = allEvents.find((event) => event.slug === "sabado");
  const visibleEvents = saturdayOnly && saturdayEvent ? [saturdayEvent] : allEvents;
  const invitationEvents = withInvitationEventArtwork(visibleEvents);
  const targetEvent = saturdayOnly ? saturdayEvent || visibleEvents[0] : visibleEvents[0];
  const content = createInvitationContent(settings, saturdayOnly && saturdayEvent ? {
    dateLabel: formatDayMonth(saturdayEvent.date),
    yearLabel: saturdayEvent.date.slice(0, 4),
    introduction: `Te invitamos a compartir con nosotros\nen nuestra boda el ${formatLongDate(saturdayEvent.date)}`,
    discoverLabel: "Descubrir la celebración",
  } : undefined);

  return (
    <InvitationExperience content={content}>
      <ItinerarySection events={invitationEvents} />
      <RsvpSection settings={settings} events={visibleEvents} saturdayOnly={saturdayOnly} />
      <DeadlineSection settings={settings} targetEvent={targetEvent} />
      <PublicFooter settings={settings} />
    </InvitationExperience>
  );
}
