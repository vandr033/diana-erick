export type InvitationState =
  | "closed"
  | "releasing-seal"
  | "opening-flap"
  | "raising-card"
  | "opened";

export const invitationTimings = {
  seal: 220,
  flapComplete: 650,
  cardRiseComplete: 1100,
  total: 1500,
} as const;
