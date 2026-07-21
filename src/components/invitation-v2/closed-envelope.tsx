import Image from "next/image";
import type {
  CSSProperties,
  MouseEventHandler,
  PointerEventHandler,
  Ref,
} from "react";
import type { WeddingInvitationContent } from "./invitation-content";
import type { InvitationState } from "./invitation-types";
import { InvitationCard } from "./invitation-card";
import styles from "./invitation-v2.module.css";

type EnvelopeSceneProps = {
  content: WeddingInvitationContent;
  state: InvitationState;
  dragProgress: number;
  headingRef: Ref<HTMLHeadingElement>;
  onDiscover: () => void;
  onOpen: MouseEventHandler<HTMLButtonElement>;
  pointerHandlers: {
    onPointerDown: PointerEventHandler<HTMLButtonElement>;
    onPointerMove: PointerEventHandler<HTMLButtonElement>;
    onPointerUp: PointerEventHandler<HTMLButtonElement>;
    onPointerCancel: PointerEventHandler<HTMLButtonElement>;
  };
};

type DragStyle = CSSProperties & {
  "--drag-progress": number;
};

function WaxSeal({ open = false }: { open?: boolean }) {
  return (
    <span
      className={open ? styles.openSeal : styles.closedSeal}
      aria-hidden="true"
    >
      <Image
        src="/images/D-E-Stamp-cutout.png"
        alt=""
        fill
        sizes={open ? "68px" : "102px"}
        className={styles.sealImage}
        draggable={false}
        priority
      />
      <span className={styles.sealCrack} />
    </span>
  );
}

export function ClosedEnvelope({
  content,
  state,
  dragProgress,
  headingRef,
  onDiscover,
  onOpen,
  pointerHandlers,
}: EnvelopeSceneProps) {
  const isOpened = state === "opened";

  return (
    <section id="inicio" className={styles.invitationStage}>
      <header className={styles.closedHeader} aria-hidden={state !== "closed"}>
        <span>{content.headerDate}</span>
        <Image
          src="/images/hero-flower-placeholder.png"
          alt=""
          width={279}
          height={164}
          className={styles.closedFlowerImage}
          priority
        />
        <span>{content.headerYear}</span>
      </header>

      <div
        className={styles.scene}
        style={{ "--drag-progress": dragProgress } as DragStyle}
      >
        <span className={styles.sceneShadow} aria-hidden="true" />
        <span className={styles.envelopeBack} aria-hidden="true" />

        <span className={styles.envelopeInterior} aria-hidden="true" />

        <span className={styles.openFlap} aria-hidden="true">
          <span className={styles.flapFace} />
          <span className={styles.flapBack} />
        </span>

        <article
          className={styles.invitationCard}
          aria-hidden={!isOpened}
          inert={!isOpened}
        >
          <InvitationCard
            content={content}
            headingId="invitation-v2-title"
            headingRef={headingRef}
            interactive
            onDiscover={onDiscover}
          />
        </article>

        <span className={styles.leftFold} aria-hidden="true" />
        <span className={styles.rightFold} aria-hidden="true" />
        <span className={styles.frontPocket} aria-hidden="true" />

        <svg
          className={styles.seamLines}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M5 1L50 49L95 1" />
          <path d="M1 99L50 50L99 99" />
        </svg>

        <WaxSeal />
        <WaxSeal open />

        <span className={styles.recipientDetails} aria-hidden="true">
          <span>Para: Nuestro invitado</span>
          <span className={styles.recipientDivider} />
          <span>{content.formattedDateRange}</span>
        </span>

        <button
          type="button"
          className={styles.envelopeControl}
          aria-label="Abrir invitación"
          aria-expanded={isOpened}
          tabIndex={isOpened ? -1 : 0}
          onClick={onOpen}
          {...pointerHandlers}
        />

        <div className={styles.openingHint} aria-hidden="true">
          <span className={styles.hintArrow}>↑</span>
          <span>Desliza para abrir</span>
        </div>
      </div>

    </section>
  );
}
