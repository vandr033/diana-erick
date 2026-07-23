import type { SiteSettings } from "@/src/db/schema";

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
};

export function createInvitationContent(
  settings: SiteSettings,
  overrides: { dateLabel?: string; yearLabel?: string; introduction?: string; discoverLabel?: string; recipientName?: string } = {},
): WeddingInvitationContent {
  const nameLines = settings.coupleNames
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const coupleNameOne = nameLines[0]?.replace(/^&\s*/, "") || "DIANA";
  const coupleNameTwo =
    nameLines.slice(1).join(" ").replace(/^&\s*/, "") || "ERICK";

  return {
    coupleNameOne,
    coupleNameTwo,
    headerDate: overrides.dateLabel || settings.heroDateLabel,
    headerYear: overrides.yearLabel || settings.heroYearLabel,
    formattedDateRange: `${overrides.dateLabel || settings.heroDateLabel} ${overrides.yearLabel || settings.heroYearLabel}`,
    introduction:
      overrides.introduction || settings.invitationText ||
      "Te invitamos a celebrar con nosotros tres días muy especiales.",
    location: "SANTA CRUZ, BOLIVIA",
    discoverLabel: overrides.discoverLabel || "Descubrir el fin de semana",
    recipientName: overrides.recipientName,
  };
}
