import { and, count, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import { db } from "./client";
import { events, rsvpResponses, siteSettings } from "./schema";
import { defaultEvents, defaultSettings } from "@/src/lib/defaults";

function normalizeEventIconPath(event: typeof defaultEvents[number]) {
  if (!event.iconPath) return event;
  const iconPath = event.iconPath.replace(/^(\/images\/event-(?:friday|saturday|sunday)-placeholder)\.svg$/, "$1.png");
  return iconPath === event.iconPath ? event : { ...event, iconPath };
}

export async function getSettings() {
  try {
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
    return rows[0] ?? defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export async function getEvents(activeOnly = false) {
  try {
    const rows = (await db.select().from(events).orderBy(events.sortOrder)).map(normalizeEventIconPath);
    const visibleRows = activeOnly ? rows.filter((event) => event.isActive) : rows;
    return visibleRows.length ? visibleRows : defaultEvents;
  } catch {
    return (activeOnly ? defaultEvents.filter((event) => event.isActive) : defaultEvents).map(normalizeEventIconPath);
  }
}

export function responseFilterConditions(filters: {
  q?: string;
  event?: string;
  attendance?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const conditions = [];
  if (filters.q) {
    const term = `%${filters.q.toLowerCase()}%`;
    conditions.push(sql`lower(${rsvpResponses.fullName}) like ${term}`);
  }
  const eventColumn = filters.event === "viernes" ? rsvpResponses.attendsFriday : filters.event === "sabado" ? rsvpResponses.attendsSaturday : filters.event === "domingo" ? rsvpResponses.attendsSunday : null;
  if (eventColumn) conditions.push(eq(eventColumn, filters.attendance !== "no"));
  if (filters.attendance && !eventColumn) {
    const attending = filters.attendance !== "no";
    conditions.push(or(eq(rsvpResponses.attendsFriday, attending), eq(rsvpResponses.attendsSaturday, attending), eq(rsvpResponses.attendsSunday, attending)));
  }
  if (filters.dateFrom) conditions.push(gte(rsvpResponses.submittedAt, new Date(`${filters.dateFrom}T00:00:00-04:00`)));
  if (filters.dateTo) conditions.push(lte(rsvpResponses.submittedAt, new Date(`${filters.dateTo}T23:59:59-04:00`)));
  return conditions;
}

export async function getResponses(filters: { q?: string; event?: string; attendance?: string; dateFrom?: string; dateTo?: string }, page = 1, pageSize = 25) {
  const conditions = responseFilterConditions(filters);
  const where = conditions.length ? and(...conditions) : undefined;
  try {
    const [rows, totalRows] = await Promise.all([
      db.select().from(rsvpResponses).where(where).orderBy(desc(rsvpResponses.submittedAt)).limit(pageSize).offset((page - 1) * pageSize),
      db.select({ value: count() }).from(rsvpResponses).where(where),
    ]);
    return { rows, total: totalRows[0]?.value ?? 0 };
  } catch {
    return { rows: [], total: 0 };
  }
}

export async function getDashboardStats() {
  try {
    const rows = await db.select().from(rsvpResponses).orderBy(desc(rsvpResponses.submittedAt));
    return {
      total: rows.length,
      confirmations: rows.filter((row) => row.attendsFriday || row.attendsSaturday || row.attendsSunday).length,
      friday: rows.filter((row) => row.attendsFriday).length,
      saturday: rows.filter((row) => row.attendsSaturday).length,
      sunday: rows.filter((row) => row.attendsSunday).length,
      none: rows.filter((row) => !row.attendsFriday && !row.attendsSaturday && !row.attendsSunday).length,
      recent: rows.slice(0, 10),
    };
  } catch {
    return { total: 0, confirmations: 0, friday: 0, saturday: 0, sunday: 0, none: 0, recent: [] };
  }
}
