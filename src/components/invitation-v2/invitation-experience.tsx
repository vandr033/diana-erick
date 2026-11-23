"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { WeddingInvitationContent } from "./invitation-content";
import { ClosedEnvelope } from "./closed-envelope";
import { useEnvelopeInteraction } from "./use-envelope-interaction";
import styles from "./invitation-v2.module.css";

type InvitationExperienceProps = {
  content: WeddingInvitationContent;
  children: ReactNode;
  transportDays?: readonly { slug: string; label: string }[];
};

export function InvitationExperience({
  content,
  children,
  transportDays,
}: InvitationExperienceProps) {
  const searchParams = useSearchParams();
  const transportDay = transportDays?.find(({ slug }) => slug === searchParams.get("transporte"));
  const {
    state,
    dragProgress,
    prefersReducedMotion,
    openInvitation,
    pointerHandlers,
  } = useEnvelopeInteraction(Boolean(transportDay || (transportDays && searchParams.has("confirmar"))));
  const headingRef = useRef<HTMLHeadingElement>(null);
  const transportHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousTransportDay = useRef<string | undefined>(undefined);
  const isOpened = state === "opened";

  useEffect(() => {
    const lastDay = previousTransportDay.current;
    previousTransportDay.current = transportDay?.slug;
    if (transportDay) {
      window.scrollTo({ top: 0, behavior: "instant" });
      transportHeadingRef.current?.focus({ preventScroll: true });
    } else if (lastDay) {
      const trigger = document.getElementById(`transporte-${lastDay}`);
      if (trigger?.getClientRects().length) {
        trigger.scrollIntoView({ block: "center", behavior: "instant" });
        trigger.focus({ preventScroll: true });
      } else {
        document.getElementById("confirmar")?.scrollIntoView({ behavior: "instant" });
      }
    }
  }, [transportDay]);

  useEffect(() => {
    if (isOpened) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpened]);

  useEffect(() => {
    if (!isOpened || transportHeadingRef.current) return;

    const frame = window.requestAnimationFrame(() => {
      headingRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isOpened]);

  const discoverWeekend = useCallback(() => {
    const itinerary = document.getElementById("itinerario");
    if (!itinerary) return;

    window.scrollTo({
      top: itinerary.getBoundingClientRect().top + window.scrollY,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [prefersReducedMotion]);

  return (
    <>
      {transportDay && <main className="rsvp-section" aria-labelledby="transport-title">
        <div className="rsvp-shell">
          <p className="eyebrow">{transportDay.label}</p>
          <h2 id="transport-title" ref={transportHeadingRef} tabIndex={-1}>Transporte</h2>
          <div className="rsvp-rule" />
          <Link className="button button--outline transport-back" href="?confirmar=1#confirmar" prefetch={false}
            onNavigate={(navigation) => {
              navigation.preventDefault();
              if (window.history.state?.fromInvitationRsvp) {
                window.history.back();
              } else {
                const url = new URL(window.location.href);
                url.searchParams.delete("transporte");
                window.history.replaceState(null, "", url);
              }
            }}>← Volver a la invitación</Link>
        </div>
      </main>}
      <div hidden={Boolean(transportDay)}>
        <main
          className={styles.root}
          data-state={state}
          data-invitation="v2"
        >
          <ClosedEnvelope
            content={content}
            state={state}
            dragProgress={dragProgress}
            headingRef={headingRef}
            onDiscover={discoverWeekend}
            onOpen={openInvitation}
            pointerHandlers={pointerHandlers}
          />
          <div className={styles.revealedExperience} aria-hidden={!isOpened} inert={!isOpened}>
            <div className={styles.existingContent}>{children}</div>
          </div>
        </main>
      </div>
    </>
  );
}
