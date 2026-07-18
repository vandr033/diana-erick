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
  return <div className="admin-page admin-page--narrow"><div className="admin-page-heading"><div><Link className="admin-back-link" href={"/admin/responses" as never}>← Respuestas</Link><p className="admin-eyebrow">Detalle de respuesta</p><h1>{response.fullName}</h1><p className="admin-subtitle">Enviada el {formatDateTime(response.submittedAt)} · Origen: {response.source === "admin" ? "Administrador" : "Invitado"}</p></div><DeleteResponseButton id={response.id} /></div><section className="admin-section"><ResponseForm response={response} /></section></div>;
}
import Link from "next/link";
