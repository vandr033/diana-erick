"use client";

import { useRef } from "react";
import type { Event as WeddingEvent } from "@/src/db/schema";
import { formatLongDate } from "@/src/lib/dates";

export function EventDetailsDialog({ event }: { event: WeddingEvent }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const open = () => {
    dialogRef.current?.showModal();
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());
  };
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button className="event-details-trigger" type="button" onClick={open}>
        Ver detalles
      </button>
      <dialog ref={dialogRef} className="event-dialog" aria-labelledby={`dialog-title-${event.slug}`}>
        <div className="event-dialog__inner">
          <button ref={closeButtonRef} className="dialog-close" type="button" onClick={close} aria-label="Cerrar detalles">
            Cerrar
          </button>
          <p className="eyebrow">{formatLongDate(event.date)}</p>
          <h2 id={`dialog-title-${event.slug}`}>{event.title}</h2>
          <p className="event-dialog__subtitle">{event.subtitle}</p>
          <div className="event-dialog__details">
            {event.startTime && <p><strong>Horario</strong>{event.startTime}{event.endTime ? ` – ${event.endTime}` : ""}</p>}
            {event.venueName && <p><strong>Lugar</strong>{event.venueName}</p>}
            {event.address && <p><strong>Dirección</strong>{event.address}</p>}
            {event.description && <p><strong>Detalles</strong>{event.description}</p>}
            {event.dressCodeDescription && <p><strong>{event.dressCodeTitle || "Vestimenta"}</strong>{event.dressCodeDescription}</p>}
            {event.additionalNote && <p><strong>Nota</strong>{event.additionalNote}</p>}
          </div>
          {event.mapsUrl && <a className="text-link" href={event.mapsUrl} target="_blank" rel="noopener noreferrer">Ver ubicación ↗</a>}
        </div>
      </dialog>
    </>
  );
}
