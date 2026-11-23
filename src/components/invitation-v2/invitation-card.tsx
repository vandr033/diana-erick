import type { Ref } from "react";
import Image from "next/image";
import type { WeddingInvitationContent } from "./invitation-content";
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
  const { parents } = content;
  const introduction = (
    <p className={styles.cardIntroduction}>
      {content.introduction.split("\n").map((line, index) => <span key={index}>{line}</span>)}
    </p>
  );
  const names = (
    <>
      <span>{content.coupleNameOne}</span>
      <span className={styles.secondNameLine}>
        <span className={parents ? styles.conjunction : styles.ampersand}>{parents ? "y" : "&"}</span>
        <span>{content.coupleNameTwo}</span>
      </span>
    </>
  );

  return (
    <div className={styles.cardContents}>
      <Image
        src="/images/hero-flower-placeholder.png"
        alt=""
        width={279}
        height={164}
        className={styles.cardBotanicalImage}
        priority
      />
      {parents && <>
        <p className={styles.blessing}>Con la bendición de Dios<br /> y de nuestros padres</p>
        {(parents.diana.length > 0 || parents.erick.length > 0) && (
          <div className={styles.parentNames}>
            {[parents.diana, parents.erick].filter((family) => family.length > 0).map((family, index) => (
              <p key={index}>{family.map((name, position) => <span key={position}>{name}</span>)}</p>
            ))}
          </div>
        )}
      </>}
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
      {parents && introduction}
      <p className={styles.cardDate}>{content.formattedDateRange}</p>
      {!parents && introduction}
      {content.location && (
        <p className={styles.cardLocation}>{content.location}</p>
      )}
      {interactive ? (
        <button
          type="button"
          className={styles.discoverButton}
          onClick={onDiscover}
        >
          {content.discoverLabel}
        </button>
      ) : (
        <span className={styles.previewAction} aria-hidden="true">
          {content.discoverLabel}
        </span>
      )}
    </div>
  );
}
