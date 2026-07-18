import Image from "next/image";
import type { Event } from "@/src/db/schema";
import { formatDayMonth } from "@/src/lib/dates";
import { EventDetailsDialog } from "./event-details-dialog";

export function EventColumn({ event }: { event: Event }) {
  return (
    <article className={`event-column event-column--${event.slug}`}>
      <div className="event-column__icon-wrap">
        {event.iconPath && <Image src={event.iconPath} alt="" width={92} height={92} className="event-column__icon" />}
      </div>
      <p className="event-column__title">{event.title}</p>
      <p className="event-column__date">{formatDayMonth(event.date)}</p>
      <p className="event-column__subtitle">{event.subtitle}</p>
      <div className="event-column__dress">
        {event.dressCodeTitle && <p className="event-column__label">{event.dressCodeTitle}</p>}
        {event.dressCodeDescription && <p className="event-column__value">{event.dressCodeDescription}</p>}
      </div>
      {event.additionalNote && <p className="event-column__note">{event.additionalNote}</p>}
      <div className="event-column__actions">
        <EventDetailsDialog event={event} />
        {event.mapsUrl && <a href={event.mapsUrl} target="_blank" rel="noopener noreferrer" className="event-location-link">Ver ubicación ↗</a>}
      </div>
    </article>
  );
}
