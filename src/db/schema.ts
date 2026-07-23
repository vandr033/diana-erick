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
  hotelName: text("hotel_name").notNull().default("Hotel recomendado"),
  hotelLocationUrl: text("hotel_location_url").notNull().default("https://maps.google.com"),
  hotelWebsiteUrl: text("hotel_website_url").notNull().default("https://example.com"),
  transportMessage: text("transport_message").notNull().default("Para su comodidad, habrá transporte desde {hotel} hacia {eventos}. Si se hospedan en otro lugar, les pedimos coordinar su traslado a {hotel} o llegar directamente al lugar de cada evento."),
  updatedAt: timestamp("updated_at"),
});

export const attendanceValues = ["yes", "no", "maybe"] as const;

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
    attendsFriday: text("attends_friday", { enum: attendanceValues }).notNull(),
    attendsSaturday: text("attends_saturday", { enum: attendanceValues }).notNull(),
    attendsSunday: text("attends_sunday", { enum: attendanceValues }).notNull(),
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

export const whatsappMessageStatuses = ["queued", "sending", "sent", "delivered", "read", "failed"] as const;

export const invitationGuests = sqliteTable(
  "invitation_guests",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull(),
    name: text("name").notNull(),
    phoneNumber: text("phone_number").notNull(),
    saturdayOnly: integer("saturday_only", { mode: "boolean" }).notNull().default(false),
    customMessage: text("custom_message"),
    invitationOpenedAt: integer("invitation_opened_at", { mode: "timestamp_ms" }),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("invitation_guests_token_idx").on(table.token),
    uniqueIndex("invitation_guests_phone_number_idx").on(table.phoneNumber),
    index("invitation_guests_opened_idx").on(table.invitationOpenedAt),
  ],
);

export const whatsappMessages = sqliteTable(
  "whatsapp_messages",
  {
    id: text("id").primaryKey(),
    guestId: text("guest_id").notNull().references(() => invitationGuests.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    status: text("status", { enum: whatsappMessageStatuses }).notNull().default("queued"),
    providerMessageId: text("provider_message_id"),
    errorMessage: text("error_message"),
    attempts: integer("attempts").notNull().default(0),
    queuedAt: timestamp("queued_at"),
    processingStartedAt: integer("processing_started_at", { mode: "timestamp_ms" }),
    sentAt: integer("sent_at", { mode: "timestamp_ms" }),
    deliveredAt: integer("delivered_at", { mode: "timestamp_ms" }),
    readAt: integer("read_at", { mode: "timestamp_ms" }),
    failedAt: integer("failed_at", { mode: "timestamp_ms" }),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("whatsapp_messages_guest_idx").on(table.guestId),
    uniqueIndex("whatsapp_messages_provider_message_idx").on(table.providerMessageId),
    index("whatsapp_messages_status_idx").on(table.status),
  ],
);

export type SiteSettings = typeof siteSettings.$inferSelect;
export type Event = typeof events.$inferSelect;
export type RsvpResponse = typeof rsvpResponses.$inferSelect;
export type Attendance = (typeof attendanceValues)[number];
export type InvitationGuest = typeof invitationGuests.$inferSelect;
export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type WhatsappMessageStatus = (typeof whatsappMessageStatuses)[number];
