import { sql } from "drizzle-orm";
import {
  integer,
  index,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamp = (name: string) =>
  integer(name, { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(strftime('%s','now') as integer) * 1000)`);

export const adminUsers = sqliteTable(
  "admin_users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [uniqueIndex("admin_users_email_idx").on(table.email)],
);

export const siteSettings = sqliteTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  coupleNames: text("couple_names").notNull(),
  heroDateLabel: text("hero_date_label").notNull(),
  heroYearLabel: text("hero_year_label").notNull(),
  invitationText: text("invitation_text").notNull(),
  heroButtonLabel: text("hero_button_label").notNull(),
  rsvpTitle: text("rsvp_title").notNull(),
  fullNameLabel: text("full_name_label").notNull(),
  attendancePromptLabel: text("attendance_prompt_label").notNull(),
  commentLabel: text("comment_label").notNull(),
  submitButtonLabel: text("submit_button_label").notNull(),
  confirmationTitle: text("confirmation_title").notNull(),
  confirmationMessage: text("confirmation_message").notNull(),
  submitAnotherLabel: text("submit_another_label").notNull(),
  rsvpDeadlineDate: text("rsvp_deadline_date").notNull(),
  deadlinePrefix: text("deadline_prefix").notNull(),
  deadlineSubtitle: text("deadline_subtitle").notNull(),
  footerText: text("footer_text").notNull(),
  siteTitle: text("site_title").notNull(),
  metaDescription: text("meta_description").notNull(),
  rsvpEnabled: integer("rsvp_enabled", { mode: "boolean" }).notNull().default(true),
  rsvpClosedMessage: text("rsvp_closed_message").notNull(),
  updatedAt: timestamp("updated_at"),
});

export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull(),
    date: text("date").notNull(),
    startTime: text("start_time"),
    endTime: text("end_time"),
    venueName: text("venue_name"),
    address: text("address"),
    mapsUrl: text("maps_url"),
    description: text("description"),
    dressCodeTitle: text("dress_code_title"),
    dressCodeDescription: text("dress_code_description"),
    additionalNote: text("additional_note"),
    iconPath: text("icon_path"),
    sortOrder: integer("sort_order").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [uniqueIndex("events_slug_idx").on(table.slug)],
);

export const rsvpResponses = sqliteTable(
  "rsvp_responses",
  {
    id: text("id").primaryKey(),
    fullName: text("full_name").notNull(),
    attendsFriday: integer("attends_friday", { mode: "boolean" }).notNull(),
    attendsSaturday: integer("attends_saturday", { mode: "boolean" }).notNull(),
    attendsSunday: integer("attends_sunday", { mode: "boolean" }).notNull(),
    comment: text("comment"),
    source: text("source", { enum: ["public", "admin"] }).notNull().default("public"),
    submittedAt: timestamp("submitted_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    index("rsvp_full_name_idx").on(table.fullName),
    index("rsvp_submitted_at_idx").on(table.submittedAt),
    index("rsvp_friday_idx").on(table.attendsFriday),
    index("rsvp_saturday_idx").on(table.attendsSaturday),
    index("rsvp_sunday_idx").on(table.attendsSunday),
  ],
);

export type SiteSettings = typeof siteSettings.$inferSelect;
export type Event = typeof events.$inferSelect;
export type RsvpResponse = typeof rsvpResponses.$inferSelect;
