CREATE TABLE `admin_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer DEFAULT (cast(strftime('%s','now') as integer) * 1000) NOT NULL,
	`updated_at` integer DEFAULT (cast(strftime('%s','now') as integer) * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_email_idx` ON `admin_users` (`email`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`subtitle` text NOT NULL,
	`date` text NOT NULL,
	`start_time` text,
	`end_time` text,
	`venue_name` text,
	`address` text,
	`maps_url` text,
	`description` text,
	`dress_code_title` text,
	`dress_code_description` text,
	`additional_note` text,
	`icon_path` text,
	`sort_order` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(strftime('%s','now') as integer) * 1000) NOT NULL,
	`updated_at` integer DEFAULT (cast(strftime('%s','now') as integer) * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_slug_idx` ON `events` (`slug`);--> statement-breakpoint
CREATE TABLE `rsvp_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`attends_friday` integer NOT NULL,
	`attends_saturday` integer NOT NULL,
	`attends_sunday` integer NOT NULL,
	`comment` text,
	`source` text DEFAULT 'public' NOT NULL,
	`submitted_at` integer DEFAULT (cast(strftime('%s','now') as integer) * 1000) NOT NULL,
	`updated_at` integer DEFAULT (cast(strftime('%s','now') as integer) * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rsvp_full_name_idx` ON `rsvp_responses` (`full_name`);--> statement-breakpoint
CREATE INDEX `rsvp_submitted_at_idx` ON `rsvp_responses` (`submitted_at`);--> statement-breakpoint
CREATE INDEX `rsvp_friday_idx` ON `rsvp_responses` (`attends_friday`);--> statement-breakpoint
CREATE INDEX `rsvp_saturday_idx` ON `rsvp_responses` (`attends_saturday`);--> statement-breakpoint
CREATE INDEX `rsvp_sunday_idx` ON `rsvp_responses` (`attends_sunday`);--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`couple_names` text NOT NULL,
	`hero_date_label` text NOT NULL,
	`hero_year_label` text NOT NULL,
	`invitation_text` text NOT NULL,
	`hero_button_label` text NOT NULL,
	`rsvp_title` text NOT NULL,
	`full_name_label` text NOT NULL,
	`attendance_prompt_label` text NOT NULL,
	`comment_label` text NOT NULL,
	`submit_button_label` text NOT NULL,
	`confirmation_title` text NOT NULL,
	`confirmation_message` text NOT NULL,
	`submit_another_label` text NOT NULL,
	`rsvp_deadline_date` text NOT NULL,
	`deadline_prefix` text NOT NULL,
	`deadline_subtitle` text NOT NULL,
	`footer_text` text NOT NULL,
	`site_title` text NOT NULL,
	`meta_description` text NOT NULL,
	`rsvp_enabled` integer DEFAULT true NOT NULL,
	`rsvp_closed_message` text NOT NULL,
	`updated_at` integer DEFAULT (cast(strftime('%s','now') as integer) * 1000) NOT NULL
);
