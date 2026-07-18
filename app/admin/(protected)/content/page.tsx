import { ContentForm } from "@/src/components/admin/content-form";
import { getSettings } from "@/src/db/queries";

export default async function ContentPage() { return <div className="admin-page"><div className="admin-page-heading"><div><p className="admin-eyebrow">Edición pública</p><h1>Contenido</h1><p className="admin-subtitle">Actualiza los textos de la invitación sin editar código.</p></div></div><section className="admin-section"><ContentForm settings={await getSettings()} /></section></div>; }
