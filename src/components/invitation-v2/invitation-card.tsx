import type { Ref } from "react";
import type { WeddingInvitationContent } from "./invitation-content";
import { BotanicalDecoration } from "./botanical-decoration";
import styles from "./invitation-v2.module.css";

type InvitationCardProps = {
  content: WeddingInvitationContent;
  headingId?: string;
  headingRef?: Ref<HTMLHeadingElement>;
  interactive?: boolean;
  onDiscover?: () => void;
};

export function InvitationCard({
  content,
  headingId,
  headingRef,
  interactive = false,
  onDiscover,
}: InvitationCardProps) {
  const names = (
    <>
      <span>{content.coupleNameOne}</span>
      <span className={styles.secondNameLine}>
        <span className={styles.ampersand}>&amp;</span>
        <span>{content.coupleNameTwo}</span>
      </span>
    </>
  );

  return (
    <div className={styles.cardContents}>
      <BotanicalDecoration className={styles.cardBotanical} />
      {interactive ? (
        <h1
          ref={headingRef}
          id={headingId}
          className={styles.coupleNames}
          tabIndex={-1}
        >
          {names}
        </h1>
      ) : (
        <p className={styles.coupleNames}>{names}</p>
      )}
      <span className={styles.cardOrnament} aria-hidden="true">
        <span />
      </span>
      <p className={styles.cardDate}>{content.formattedDateRange}</p>
      <p className={styles.cardIntroduction}>
        {content.introduction.split("\n").map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>
      {content.location && (
        <p className={styles.cardLocation}>{content.location}</p>
      )}
      {interactive ? (
        <button
          type="button"
          className={styles.discoverButton}
          onClick={onDiscover}
        >
          Descubrir el fin de semana
        </button>
      ) : (
        <span className={styles.previewAction} aria-hidden="true">
          Descubrir el fin de semana
        </span>
      )}
    </div>
  );
}
