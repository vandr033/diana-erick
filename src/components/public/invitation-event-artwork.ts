import type { Event } from "@/src/db/schema";

export function withInvitationEventArtwork(events: Event[]): Event[] {
  return events.map((event) => {
    if (event.slug === "viernes") {
      return { ...event, iconPath: "/images/event-friday-transparent.png" };
    }

    if (event.slug === "domingo") {
      return { ...event, iconPath: "/images/louie-cutout.png" };
    }

    return event;
  });
}
