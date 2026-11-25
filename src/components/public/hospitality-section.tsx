import type { Event, SiteSettings } from "@/src/db/schema";

function resolveTransportMessage(template: string, hotel: string) {
  return template
    .replaceAll("{hotel}", hotel)
    .replaceAll("{eventos}", "todos los eventos del fin de semana");
}

export function HospitalitySection({ settings, events = [], showTransport = true }: { settings: SiteSettings; events?: Event[]; showTransport?: boolean }) {
  const transportMessage = resolveTransportMessage(
    settings.transportMessage,
    settings.hotelName,
  );
  const eventLocations = events.filter((event) => event.mapsUrl);

  return (
    <section id="hospedaje" className="hospitality-section" aria-labelledby="hospitality-title">
      <div className="hospitality-section__inner">
        <div className="hospitality-section__intro">
          <p className="eyebrow">{showTransport ? "Hospedaje y traslados" : "Hospedaje y lugares"}</p>
          <h2 id="hospitality-title">Todo listo para disfrutar</h2>
        </div>
        <div className="hospitality-section__details">
          <div className="hospitality-detail">
            <p className="hospitality-detail__label">Hotel recomendado</p>
            <h3>{settings.hotelName}</h3>
            <div className="hospitality-detail__links">
              <a className="hospitality-detail__link" href={settings.hotelLocationUrl} target="_blank" rel="noreferrer">Ver ubicación</a>
              <a className="hospitality-detail__link" href={settings.hotelWebsiteUrl} target="_blank" rel="noreferrer">Visitar sitio web</a>
            </div>
          </div>
          {showTransport && <div className="hospitality-detail hospitality-detail--transport">
            <p className="hospitality-detail__label">Transporte</p>
            <p>{transportMessage}</p>
          </div>}
          {eventLocations.length > 0 && <div className="hospitality-detail">
            <p className="hospitality-detail__label">Ubicación de los eventos</p>
            <ul className="hospitality-detail__links">
              {eventLocations.map((event) => <li key={event.id}>
                <a className="hospitality-detail__link" href={event.mapsUrl ?? undefined} target="_blank" rel="noreferrer">
                  {event.title} · {event.venueName || event.subtitle} ↗
                </a>
              </li>)}
            </ul>
          </div>}
        </div>
      </div>
    </section>
  );
}
