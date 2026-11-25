import Link from "next/link";
import { getWeddingFaq } from "@/src/db/queries";
import { guestGuidePages, type GuidePage } from "@/src/lib/wedding-guide";
import { RestaurantGuide } from "./restaurant-guide";

export async function WeddingGuidePage({ page, invitationPath }: { page: GuidePage; invitationPath: string }) {
  if (page === "restaurantes") return <RestaurantGuide invitationPath={invitationPath} />;
  const { title, description } = guestGuidePages[page];
  const entries = page === "faq" ? (await getWeddingFaq()).filter((entry) => entry.published) : [];

  return <main className="rsvp-section wedding-guide-page" aria-labelledby="guide-page-title">
    <div className="rsvp-shell">
      <p className="eyebrow">Diana &amp; Erick</p>
      <h1 id="guide-page-title">{title}</h1>
      <div className="rsvp-rule" />
      {page === "faq" ? <div className="wedding-faq">
        {entries.length ? entries.map(({ id, question, answer }) => <details key={id}>
          <summary>{question}</summary>
          <p>{answer}</p>
        </details>) : <p>Pronto compartiremos las preguntas frecuentes.</p>}
      </div> : <p className="wedding-guide-page__description">{description}</p>}
      <Link className="button button--outline transport-back" href={`${invitationPath}?confirmar=1#guia`}>← Volver a la invitación</Link>
    </div>
  </main>;
}
