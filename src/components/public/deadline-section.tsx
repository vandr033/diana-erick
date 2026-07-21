import Image from "next/image";
import type { Event, SiteSettings } from "@/src/db/schema";
import { formatDeadlineHeading } from "@/src/lib/dates";
import { LiveCountdown } from "./live-countdown";

function targetIso(event: Event) {
  const time = /^\d{2}:\d{2}(?::\d{2})?$/.test(event.startTime || "") ? event.startTime : "12:00";
  return `${event.date}T${time?.length === 5 ? `${time}:00` : time}-04:00`;
}

export function DeadlineSection({ settings, targetEvent }: { settings: SiteSettings; targetEvent: Event }) {
  const heading = formatDeadlineHeading(settings.rsvpDeadlineDate);

  return (
    <section id="fecha-limite" className="deadline-section" aria-labelledby="deadline-title">
      <div id="cuenta-regresiva" className="deadline-section__countdown-pane">
        <div className="deadline-section__photo">
          <Image
            src="/images/footer-gallery-cutout.png"
            alt="Diana y Erick durante su compromiso"
            width={1086}
            height={1448}
            sizes="(max-width: 640px) 58vw, min(21vw, 280px)"
            unoptimized
          />
        </div>
        <div className="deadline-section__countdown">
          <p className="eyebrow">La celebración se acerca</p>
          <h2>Contando los días</h2>
          <LiveCountdown
            targetIso={targetIso(targetEvent)}
            eventName={targetEvent.title.toLocaleLowerCase("es-BO")}
          />
        </div>
      </div>
      <div className="deadline-section__rsvp-pane">
        <div className="deadline-copy">
          <div className="deadline-rule" />
          <h2 id="deadline-title">{heading.map((line) => <span key={line}>{line}</span>)}</h2>
          <div className="deadline-rule" />
          <p><strong>{settings.deadlineSubtitle}</strong></p>
        </div>
      </div>
    </section>
  );
}
