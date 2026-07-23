export function invitationUrl(origin: string, token: string, saturdayOnly: boolean) {
  return `${origin.replace(/\/$/, "")}/invitacion/${token}${saturdayOnly ? "/sabado" : ""}`;
}

export function renderInvitationMessage(template: string, name: string, link: string) {
  return template.replaceAll("{name}", name).replaceAll("{link}", link);
}
