import Image from "next/image";
import Link from "next/link";

const restaurants = [
  { name: "Jardín de Asia", cuisine: "Cocina asiática contemporánea", location: "Av. San Martín · Calle G" },
  { name: "Bodegón La Juanita", cuisine: "Cocina de autor", location: "Calle 9 Oeste · Equipetrol" },
  { name: "Boca Mixtura", cuisine: "Patio gastronómico", location: "Manzana 40 · Plaza Empresarial" },
  { name: "El Arriero", cuisine: "Parrilla", location: "Av. San Martín · esquina 4 Este" },
  { name: "Sach’a Huaska", cuisine: "Cocina internacional", location: "Patio Design · Av. Busch" },
  { name: "Manga Rosa", cuisine: "Cocina contemporánea", location: "Santa Cruz de la Sierra" },
  { name: "Los Hierros", cuisine: "Carnes y parrilla", location: "Calle G · Av. Salvador · Equipetrol" },
  { name: "Cielo", cuisine: "Bar de altura y cócteles", location: "Hotel Los Tajibos" },
  { name: "Voraz", cuisine: "Cocina casual", location: "Santa Cruz de la Sierra" },
  { name: "Caudilla", cuisine: "Brasas y platos para compartir", location: "Green Tower · Av. San Martín" },
  { name: "Spritz", cuisine: "Bar mediterráneo", location: "Av. San Martín" },
  { name: "Casa del Camba", cuisine: "Cocina típica cruceña", location: "Av. Cristóbal de Mendoza 1365" },
  { name: "Primitivo", cuisine: "Parrilla", location: "Santa Cruz de la Sierra" },
];

export function RestaurantGuide({ invitationPath }: { invitationPath: string }) {
  return <main className="rsvp-section wedding-guide-page wedding-guide-page--restaurants" aria-labelledby="guide-page-title">
    <div className="restaurant-guide">
      <header className="restaurant-guide__header">
        <p className="eyebrow">Diana &amp; Erick · Santa Cruz</p>
        <h1 id="guide-page-title">Dónde comer</h1>
        <p>Una pequeña guía de sabores para disfrutar entre celebraciones.</p>
        <Image className="restaurant-guide__flower" src="/images/hero-flower-placeholder.png" alt="" aria-hidden="true" width={280} height={294} />
      </header>
      <ol className="restaurant-guide__list">
        {restaurants.map(({ name, cuisine, location }, index) => {
          const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${location} Santa Cruz de la Sierra Bolivia`)}`;
          return <li className="restaurant-guide__entry" key={name}>
            <span className="restaurant-guide__number">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2>{name}</h2>
              <p className="restaurant-guide__cuisine">{cuisine}</p>
              <p className="restaurant-guide__location">{location}</p>
              <a href={mapUrl} target="_blank" rel="noreferrer">Ver ubicación ↗</a>
            </div>
          </li>;
        })}
      </ol>
      <p className="restaurant-guide__note">Abre el mapa para consultar la dirección y los horarios actuales.</p>
    </div>
    <Link className="button button--outline transport-back" href={`${invitationPath}?confirmar=1#guia`}>← Volver a la invitación</Link>
  </main>;
}
