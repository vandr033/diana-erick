import type { InvitationPhase, SiteSettings } from "@/src/db/schema";

export type WeddingInvitationContent = {
  coupleNameOne: string;
  coupleNameTwo: string;
  headerDate: string;
  headerYear: string;
  formattedDateRange: string;
  introduction: string;
  location: string;
  discoverLabel: string;
  recipientName?: string;
  parents?: { diana: string[]; erick: string[] };
};

function lines(text: string) {
  return text.split("\n").map((line) => line.trim()).filter(Boolean);
}

export function createInvitationContent(
  settings: SiteSettings,
  overrides: { dateLabel?: string; yearLabel?: string; introduction?: string; discoverLabel?: string; recipientName?: string; phase?: InvitationPhase } = {},
): WeddingInvitationContent {
  const nameLines = lines(settings.coupleNames);
  const isFinal = overrides.phase === "final";

  const coupleNameOne = nameLines[0]?.replace(/^&\s*/, "") || "DIANA";
  const coupleNameTwo =
    nameLines.slice(1).join(" ").replace(/^&\s*/, "") || "ERICK";

  return {
    coupleNameOne,
    coupleNameTwo,
    headerDate: overrides.dateLabel || settings.heroDateLabel,
    headerYear: overrides.yearLabel || settings.heroYearLabel,
    formattedDateRange: `${overrides.dateLabel || settings.heroDateLabel} ${overrides.yearLabel || settings.heroYearLabel}`,
    introduction: isFinal
      ? "Deseamos compartir con ustedes este día tan especial."
      : overrides.introduction || settings.invitationText || "Te invitamos a celebrar con nosotros tres días muy especiales.",
    location: "SANTA CRUZ, BOLIVIA",
    discoverLabel: overrides.discoverLabel || "Descubrir el fin de semana",
    recipientName: overrides.recipientName,
    parents: isFinal ? { diana: lines(settings.dianaParents), erick: lines(settings.erickParents) } : undefined,
  };
}
