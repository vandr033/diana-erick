import Image from "next/image";
import type { ReactNode, Ref } from "react";
import type { Event, SiteSettings } from "@/src/db/schema";
import { formatDeadlineHeading } from "@/src/lib/dates";
import { LiveCountdown } from "./live-countdown";

function targetIso(event: Event) {
  const time = /^\d{2}:\d{2}(?::\d{2})?$/.test(event.startTime || "") ? event.startTime : "12:00";
  return `${event.date}T${time?.length === 5 ? `${time}:00` : time}-04:00`;
}

export function DeadlineSection({ settings, targetEvent, actions, headingRef }: {
  settings: Pick<SiteSettings, "rsvpDeadlineDate" | "deadlineSubtitle">;
  targetEvent: Event;
  actions?: ReactNode;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
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
      <div id={actions ? "guia" : undefined} className="deadline-section__rsvp-pane">
        <div className={actions ? "deadline-copy deadline-copy--guide" : "deadline-copy"}>
          <div className="deadline-rule" />
          <h2 id="deadline-title" ref={headingRef} tabIndex={actions ? -1 : undefined}>
            {actions ? "Muchas gracias por confirmar!" : formatDeadlineHeading(settings.rsvpDeadlineDate).map((line) => <span key={line}>{line}</span>)}
          </h2>
          <div className="deadline-rule" />
          {actions || <p><strong>{settings.deadlineSubtitle}</strong></p>}
        </div>
      </div>
    </section>
  );
}
