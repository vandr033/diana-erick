import { DeadlineSection } from "./deadline-section";
import { HeroSection } from "./hero-section";
import { ItinerarySection } from "./itinerary-section";
import { PublicFooter } from "./public-footer";
import { RsvpSection } from "./rsvp-section";
import { getEvents, getSettings } from "@/src/db/queries";

export async function InvitationPage({ saturdayOnly = false }: { saturdayOnly?: boolean }) {
  const [settings, allEvents] = await Promise.all([getSettings(), getEvents(true)]);
  const events = saturdayOnly ? allEvents.filter((event) => event.slug === "sabado") : allEvents;
  return (
    <main data-invitation={saturdayOnly ? "sabado" : "todos"}>
      <HeroSection settings={settings} />
      <ItinerarySection events={events} />
      <RsvpSection settings={settings} events={events} saturdayOnly={saturdayOnly} />
      <DeadlineSection settings={settings} />
      <PublicFooter settings={settings} />
    </main>
  );
}
