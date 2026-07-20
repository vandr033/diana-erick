import Image from "next/image";
import type { Event } from "@/src/db/schema";
import { formatDayMonth } from "@/src/lib/dates";
import { EventDetailsDialog } from "./event-details-dialog";

export function EventColumn({ event }: { event: Event }) {
  const isSaturday = event.slug === "sabado";

  const icon = (
    <div className="event-column__icon-wrap">
      {event.iconPath && (
        <Image
          src={event.iconPath}
          alt=""
          width={140}
          height={140}
          className="event-column__icon"
        />
      )}
    </div>
  );

  const actions = (
    <div className="event-column__actions">
      <EventDetailsDialog
        event={event}
        triggerLabel={isSaturday ? "Más detalles" : undefined}
      />
      {event.mapsUrl && (
        <a
          href={event.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="event-location-link"
        >
          Ver ubicación ↗
        </a>
      )}
    </div>
  );

  return (
    <article className={`event-column event-column--${event.slug}`}>
      {!isSaturday && icon}
      <p className="event-column__title">{event.title}</p>
      <p className="event-column__date">{formatDayMonth(event.date)}</p>
      <p className="event-column__subtitle">{event.subtitle}</p>
      {isSaturday && icon}
      <div className="event-column__dress">
        {event.dressCodeTitle && <p className="event-column__label">{event.dressCodeTitle}</p>}
        {event.dressCodeDescription && <p className="event-column__value">{event.dressCodeDescription}</p>}
      </div>
      {isSaturday && actions}
      {event.additionalNote && <p className="event-column__note">{event.additionalNote}</p>}
      {!isSaturday && actions}
    </article>
  );
}
