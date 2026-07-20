import Image from "next/image";
import type { SiteSettings } from "@/src/db/schema";
import { formatDeadlineHeading } from "@/src/lib/dates";

export function DeadlineSection({ settings }: { settings: SiteSettings }) {
  const heading = formatDeadlineHeading(settings.rsvpDeadlineDate);
  return (
    <section id="fecha-limite" className="deadline-section" aria-labelledby="deadline-title">
      <div className="deadline-gallery" aria-label="Imágenes decorativas">
        <Image
          src="/images/footer-gallery-cutout.png"
          alt="Diana y Erick en tres fotografías enmarcadas"
          width={1448}
          height={892}
          sizes="(max-width: 640px) calc(100vw - 48px), 38vw"
        />
      </div>
      <div className="deadline-copy">
        <div className="deadline-rule" />
        <h2 id="deadline-title">{heading.map((line) => <span key={line}>{line}</span>)}</h2>
        <div className="deadline-rule" />
        <p>{settings.deadlineSubtitle}</p>
      </div>
    </section>
  );
}
