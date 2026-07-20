import type { SiteSettings } from "@/src/db/schema";

export type WeddingInvitationContent = {
  coupleNameOne: string;
  coupleNameTwo: string;
  formattedDateRange: string;
  introduction: string;
  location: string;
};

export function createInvitationContent(
  settings: SiteSettings,
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
    formattedDateRange: `${settings.heroDateLabel} ${settings.heroYearLabel}`,
    introduction:
      settings.invitationText ||
      "Te invitamos a celebrar con nosotros tres días muy especiales.",
    location: "SANTA CRUZ, BOLIVIA",
  };
}
