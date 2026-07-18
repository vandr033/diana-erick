import Image from "next/image";
import type { SiteSettings } from "@/src/db/schema";

export function HeroSection({ settings }: { settings: SiteSettings }) {
  return (
    <section id="inicio" className="hero-section" aria-labelledby="hero-title">
      <div className="hero-topline">
        <span>{settings.heroDateLabel}</span>
        <Image src="/images/hero-flower-placeholder.png" alt="" width={100} height={124} priority className="hero-flower" />
        <span>{settings.heroYearLabel}</span>
      </div>
      <h1 id="hero-title" className="hero-title">
        {settings.coupleNames.split("\n").map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}
      </h1>
      <div className="hero-rule" />
      <p className="hero-invitation">{settings.invitationText.split("\n").map((line) => <span key={line}>{line}</span>)}</p>
      <div className="hero-rule" />
      <a className="button button--olive hero-cta" href="#itinerario">{settings.heroButtonLabel}</a>
    </section>
  );
}
