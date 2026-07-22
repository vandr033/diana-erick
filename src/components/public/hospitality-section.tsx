import type { SiteSettings } from "@/src/db/schema";

function resolveTransportMessage(template: string, hotel: string, saturdayOnly: boolean) {
  const events = saturdayOnly ? "la celebración del sábado" : "todos los eventos del fin de semana";
  return template.replaceAll("{hotel}", hotel).replaceAll("{eventos}", events);
}

export function HospitalitySection({ settings, saturdayOnly }: { settings: SiteSettings; saturdayOnly: boolean }) {
  const transportMessage = resolveTransportMessage(settings.transportMessage, settings.hotelName, saturdayOnly);

  return (
    <section className="hospitality-section" aria-labelledby="hospitality-title">
      <div className="hospitality-section__inner">
        <div className="hospitality-section__intro">
          <p className="eyebrow">Hospedaje y traslados</p>
          <h2 id="hospitality-title">Todo listo para disfrutar</h2>
        </div>
        <div className="hospitality-section__details">
          <div className="hospitality-detail">
            <p className="hospitality-detail__label">Hotel recomendado</p>
            <h3>{settings.hotelName}</h3>
            <a className="hospitality-detail__link" href={settings.hotelLocationUrl} target="_blank" rel="noreferrer">Ver ubicación</a>
          </div>
          <div className="hospitality-detail hospitality-detail--transport">
            <p className="hospitality-detail__label">Transporte</p>
            <p>{transportMessage}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
