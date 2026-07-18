import Link from "next/link";
import { AdminMobileMenu } from "./admin-mobile-menu";
import { LogoutButton } from "./logout-button";

const links = [
  ["Resumen", "/admin"],
  ["Respuestas", "/admin/responses"],
  ["Contenido", "/admin/content"],
  ["Eventos", "/admin/events"],
  ["Configuración", "/admin/settings"],
] as const;

export function AdminShell({ children, email }: { children: React.ReactNode; email?: string }) {
  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-brand"><span className="admin-brand__mark">D</span><div><strong>Diana & Erick</strong><small>Panel privado</small></div></div>
        <nav aria-label="Navegación de administración">
          {links.map(([label, href]) => <Link key={href} href={href as never}>{label}</Link>)}
        </nav>
        <div className="admin-sidebar__footer"><span>{email}</span><LogoutButton /></div>
      </aside>
      <div className="admin-main-wrap">
        <header className="admin-mobile-header"><div className="admin-brand"><span className="admin-brand__mark">D</span><strong>Diana & Erick</strong></div><div className="admin-mobile-header__actions"><AdminMobileMenu email={email} /><LogoutButton /></div></header>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
