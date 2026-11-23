import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ResponseForm } from "@/src/components/admin/response-form";
import { DeleteResponseButton } from "@/src/components/admin/delete-response-button";
import { db } from "@/src/db/client";
import { rsvpResponses } from "@/src/db/schema";
import { formatDateTime } from "@/src/lib/dates";

export default async function ResponseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(rsvpResponses).where(eq(rsvpResponses.id, id)).limit(1);
  const response = rows[0];
  if (!response) notFound();
  const isFinal = response.phase === "final";
  return <div className="admin-page admin-page--narrow">
    <div className="admin-page-heading"><div><Link className="admin-back-link" href={{ pathname: "/admin/responses", query: isFinal ? { phase: "final" } : undefined }}>← Respuestas</Link><p className="admin-eyebrow">{isFinal ? "Invitación final" : "Save the Date"}</p><h1>{response.fullName}</h1><p className="admin-subtitle">Enviada el {formatDateTime(response.submittedAt)} · Origen: {response.source === "admin" ? "Administrador" : "Invitado"}</p></div><div className="admin-actions">{!isFinal && <Link className="admin-button admin-button--primary" href={{ pathname: "/admin/invitaciones", query: { respuesta: id } }}>Invitar a la boda</Link>}<DeleteResponseButton id={response.id} isFinal={isFinal} /></div></div>
    {(response.foodFeedback || response.musicFeedback) && <section className="admin-section">
      <div className="admin-section-heading"><div><h2>Comida y música</h2></div></div>
      <dl className="confirmation__summary">
        {response.foodFeedback && <div><dt>Restricciones</dt><dd>{[response.foodFeedback.options.join(", "), response.foodFeedback.details].filter(Boolean).join("\n")}</dd></div>}
        {response.musicFeedback && <div><dt>Música</dt><dd>{[response.musicFeedback.song, response.musicFeedback.style].filter(Boolean).join("\n")}</dd></div>}
      </dl>
    </section>}
    {response.flightFeedback && <section className="admin-section">
      <div className="admin-section-heading"><div><h2>Vuelos a Santa Cruz</h2><p className="admin-note">Hora local de Santa Cruz</p></div></div>
      <dl className="confirmation__summary">
        <div><dt>Llegada</dt><dd>{response.flightFeedback.arrival.replace("T", " ")}</dd></div>
        {response.flightFeedback.departure && <div><dt>Salida</dt><dd>{response.flightFeedback.departure.replace("T", " ")}</dd></div>}
        {response.flightFeedback.notes && <div><dt>Comentarios</dt><dd>{response.flightFeedback.notes}</dd></div>}
      </dl>
    </section>}
    <section className="admin-section"><ResponseForm response={response} /></section>
  </div>;
}
import Link from "next/link";
