import type { SiteSettings } from "@/src/db/schema";

export function PublicFooter({ settings }: { settings: SiteSettings }) {
  return <footer className="public-footer"><p>{settings.footerText}</p><a href="#inicio">Volver al inicio ↑</a></footer>;
}
