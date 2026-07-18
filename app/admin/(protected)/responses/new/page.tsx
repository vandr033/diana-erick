import { ResponseForm } from "@/src/components/admin/response-form";

export default function NewResponsePage() {
  return <div className="admin-page admin-page--narrow"><div className="admin-page-heading"><div><Link className="admin-back-link" href={"/admin/responses" as never}>← Respuestas</Link><p className="admin-eyebrow">Nueva respuesta</p><h1>Agregar respuesta</h1><p className="admin-subtitle">Registra manualmente una confirmación recibida.</p></div></div><section className="admin-section"><ResponseForm mode="new" /></section></div>;
}
import Link from "next/link";
