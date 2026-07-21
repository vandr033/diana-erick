PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_rsvp_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`attends_friday` text NOT NULL,
	`attends_saturday` text NOT NULL,
	`attends_sunday` text NOT NULL,
	`comment` text,
	`source` text DEFAULT 'public' NOT NULL,
	`submitted_at` integer DEFAULT (cast(strftime('%s','now') as integer) * 1000) NOT NULL,
	`updated_at` integer DEFAULT (cast(strftime('%s','now') as integer) * 1000) NOT NULL
);--> statement-breakpoint
INSERT INTO `__new_rsvp_responses` (`id`, `full_name`, `attends_friday`, `attends_saturday`, `attends_sunday`, `comment`, `source`, `submitted_at`, `updated_at`)
SELECT
	`id`,
	`full_name`,
	CASE WHEN `attends_friday` = 1 THEN 'yes' ELSE 'no' END,
	CASE WHEN `attends_saturday` = 1 THEN 'yes' ELSE 'no' END,
	CASE WHEN `attends_sunday` = 1 THEN 'yes' ELSE 'no' END,
	`comment`,
	`source`,
	`submitted_at`,
	`updated_at`
FROM `rsvp_responses`;--> statement-breakpoint
DROP TABLE `rsvp_responses`;--> statement-breakpoint
ALTER TABLE `__new_rsvp_responses` RENAME TO `rsvp_responses`;--> statement-breakpoint
CREATE INDEX `rsvp_full_name_idx` ON `rsvp_responses` (`full_name`);--> statement-breakpoint
CREATE INDEX `rsvp_submitted_at_idx` ON `rsvp_responses` (`submitted_at`);--> statement-breakpoint
CREATE INDEX `rsvp_friday_idx` ON `rsvp_responses` (`attends_friday`);--> statement-breakpoint
CREATE INDEX `rsvp_saturday_idx` ON `rsvp_responses` (`attends_saturday`);--> statement-breakpoint
CREATE INDEX `rsvp_sunday_idx` ON `rsvp_responses` (`attends_sunday`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
