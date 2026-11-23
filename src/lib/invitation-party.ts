import type { RsvpResponse } from "@/src/db/schema";

export const maxCompanions = 50;

export function companionLabel(name: string, index: number) {
  return name || `Acompañante ${index + 1}`;
}

export function attendanceCount(
  response: RsvpResponse,
  day: "attendsFriday" | "attendsSaturday" | "attendsSunday",
) {
  const individual = response.party?.saturdayAttendance;
  if (day === "attendsSaturday" && individual) {
    return individual.filter((answer) => answer === "yes").length;
  }
  return response[day] === "yes" ? 1 + (response.party?.companions.length ?? 0) : 0;
}
