import type { InvitationPhase } from "@/src/db/schema";

export function invitationUrl(origin: string, token: string, saturdayOnly: boolean, phase: InvitationPhase = "save-the-date") {
  const base = origin.replace(/\/$/, "");
  return phase === "final" ? `${base}/boda/${token}` : `${base}/invitacion/${token}${saturdayOnly ? "/sabado" : ""}`;
}

export function renderInvitationMessage(template: string, name: string, link: string) {
  return template.replaceAll("{name}", name).replaceAll("{link}", link);
}
