"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { WeddingInvitationContent } from "./invitation-content";
import { ClosedEnvelope } from "./closed-envelope";
import { useEnvelopeInteraction } from "./use-envelope-interaction";
import styles from "./invitation-v2.module.css";

type InvitationExperienceProps = {
  content: WeddingInvitationContent;
  children: ReactNode;
};

export function InvitationExperience({
  content,
  children,
}: InvitationExperienceProps) {
  const {
    state,
    dragProgress,
    prefersReducedMotion,
    openInvitation,
    pointerHandlers,
  } = useEnvelopeInteraction();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isOpened = state === "opened";

  useEffect(() => {
    if (isOpened) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpened]);

  useEffect(() => {
    if (!isOpened) return;

    window.requestAnimationFrame(() => {
      headingRef.current?.focus({ preventScroll: true });
    });
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

      <div
        className={styles.revealedExperience}
        aria-hidden={!isOpened}
        inert={!isOpened}
      >
        <div className={styles.existingContent}>
          {children}
        </div>
      </div>
    </main>
  );
}
