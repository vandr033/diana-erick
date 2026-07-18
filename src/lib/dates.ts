const spanishDate = new Intl.DateTimeFormat("es-BO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/La_Paz",
});

const spanishShortDate = new Intl.DateTimeFormat("es-BO", {
  day: "numeric",
  month: "long",
  timeZone: "America/La_Paz",
});

export function parseDate(value: string): Date {
  return new Date(`${value}T12:00:00-04:00`);
}

export function formatLongDate(value: string | Date): string {
  return spanishDate.format(typeof value === "string" ? parseDate(value) : value);
}

export function formatDayMonth(value: string): string {
  return spanishShortDate.format(parseDate(value)).toLocaleUpperCase("es-BO");
}

export function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/La_Paz",
  }).format(value);
}

export function formatDeadlineHeading(value: string): string[] {
  const date = parseDate(value);
  const day = new Intl.DateTimeFormat("es-BO", { day: "numeric", timeZone: "America/La_Paz" }).format(date);
  const month = new Intl.DateTimeFormat("es-BO", { month: "long", timeZone: "America/La_Paz" }).format(date).toLocaleUpperCase("es-BO");
  return ["FAVOR DE RSVP", `HASTA EL ${day} DE`, month];
}
