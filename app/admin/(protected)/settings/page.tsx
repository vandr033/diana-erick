import { SettingsForm } from "@/src/components/admin/settings-form";
import { getSettings } from "@/src/db/queries";
import { requireAdmin } from "@/src/lib/auth";

export default async function SettingsPage() { const [settings, session] = await Promise.all([getSettings(), requireAdmin()]); return <div className="admin-page"><div className="admin-page-heading"><div><p className="admin-eyebrow">Control</p><h1>Configuración</h1><p className="admin-subtitle">Disponibilidad de RSVP y datos básicos del sitio.</p></div></div><section className="admin-section"><SettingsForm settings={settings} adminEmail={session.email} /></section></div>; }
