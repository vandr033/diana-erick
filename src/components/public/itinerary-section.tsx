import type { Event } from "@/src/db/schema";
import { EventColumn } from "./event-column";

export function ItinerarySection({ events }: { events: Event[] }) {
  return (
    <section id="itinerario" className="itinerary-section" aria-labelledby="itinerario-title">
      <div className="itinerary-panel">
        <div className="section-intro section-intro--itinerary">
          <p className="eyebrow">{events.length === 1 ? "Una celebración para compartir" : "Tres días para celebrar"}</p>
          <h2 id="itinerario-title">{events.length === 1 ? "El sábado" : "El fin de semana"}</h2>
        </div>
        <div className={`itinerary-grid ${events.length === 1 ? "itinerary-grid--single" : ""}`}>
          {events.map((event) => <EventColumn key={event.id} event={event} />)}
        </div>
      </div>
    </section>
  );
}
