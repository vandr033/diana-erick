import Image from "next/image";
import type { SiteSettings } from "@/src/db/schema";
import { formatDeadlineHeading } from "@/src/lib/dates";

export function DeadlineSection({ settings }: { settings: SiteSettings }) {
  const heading = formatDeadlineHeading(settings.rsvpDeadlineDate);
  return (
    <section id="fecha-limite" className="deadline-section" aria-labelledby="deadline-title">
      <div className="deadline-gallery" aria-label="Imágenes decorativas">
        {([1, 2, 3] as const).map((index) => <Image key={index} src={`/images/gallery-0${index}-placeholder.svg`} alt="" width={150} height={190} />)}
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
