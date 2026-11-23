import Link from "next/link";
import { FaqForm } from "@/src/components/admin/faq-form";
import { getWeddingFaq } from "@/src/db/queries";

export default async function AdminFaqPage() {
  return <div className="admin-page admin-page--narrow">
    <div className="admin-page-heading">
      <div>
        <p className="admin-eyebrow">Guía de la boda</p>
        <h1>Preguntas frecuentes</h1>
        <p className="admin-subtitle">Edita las preguntas, cambia su orden y elige cuáles ven los invitados.</p>
      </div>
      <Link className="admin-button admin-button--secondary" href="/boda/faq">Ver FAQ</Link>
    </div>
    <section className="admin-section"><FaqForm initialEntries={await getWeddingFaq()} /></section>
  </div>;
}
