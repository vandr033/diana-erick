import type { Metadata } from "next";
import { InvitationExperience } from "@/src/components/invitation-v2/invitation-experience";
import { createInvitationContent } from "@/src/components/invitation-v2/invitation-content";
import { DeadlineSection } from "@/src/components/public/deadline-section";
import { withInvitationEventArtwork } from "@/src/components/public/invitation-event-artwork";
import { ItinerarySection } from "@/src/components/public/itinerary-section";
import { PublicFooter } from "@/src/components/public/public-footer";
import { RsvpSection } from "@/src/components/public/rsvp-section";
import { getEvents, getSettings } from "@/src/db/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Diana & Erick — Invitación",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function V2Page() {
  const [settings, events] = await Promise.all([getSettings(), getEvents(true)]);
  const content = createInvitationContent(settings);
  const invitationEvents = withInvitationEventArtwork(events);

  return (
    <InvitationExperience content={content}>
      <ItinerarySection events={invitationEvents} />
      <RsvpSection settings={settings} events={events} />
      <DeadlineSection settings={settings} />
      <PublicFooter settings={settings} />
    </InvitationExperience>
  );
}
