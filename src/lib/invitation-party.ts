import type { AttendanceDay, RsvpResponse } from "@/src/db/schema";

export const maxCompanions = 50;

export const rsvpDays = [
  { slug: "viernes", field: "attendsFriday", label: "Viernes" },
  { slug: "sabado", field: "attendsSaturday", label: "Sábado" },
  { slug: "domingo", field: "attendsSunday", label: "Domingo" },
] as const;

export function companionLabel(name: string, index: number) {
  return name || `Acompañante ${index + 1}`;
}

export function attendanceCount(
  response: RsvpResponse,
  day: AttendanceDay,
) {
  const people = response.party?.attendanceByDay?.[day];
  if (people) return people.filter((person) => person.attendance === "yes").length;
  const individual = response.party?.saturdayAttendance;
  if (day === "attendsSaturday" && individual) {
    return individual.filter((answer) => answer === "yes").length;
  }
  return response[day] === "yes" ? 1 + (response.party?.companions.length ?? 0) : 0;
}
