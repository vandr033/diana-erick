CREATE TABLE `invitation_guests__new` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`name` text NOT NULL,
	`phone_number` text,
	`saturday_only` integer DEFAULT false NOT NULL,
	`custom_message` text,
	`invitation_opened_at` integer,
	`created_at` integer DEFAULT (cast(strftime('%s','now') as integer) * 1000) NOT NULL,
	`updated_at` integer DEFAULT (cast(strftime('%s','now') as integer) * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `invitation_guests__new` (`id`, `token`, `name`, `phone_number`, `saturday_only`, `custom_message`, `invitation_opened_at`, `created_at`, `updated_at`)
SELECT `id`, `token`, `name`, `phone_number`, `saturday_only`, `custom_message`, `invitation_opened_at`, `created_at`, `updated_at`
FROM `invitation_guests`;
--> statement-breakpoint
DROP TABLE `invitation_guests`;
--> statement-breakpoint
ALTER TABLE `invitation_guests__new` RENAME TO `invitation_guests`;
--> statement-breakpoint
CREATE UNIQUE INDEX `invitation_guests_token_idx` ON `invitation_guests` (`token`);
--> statement-breakpoint
CREATE UNIQUE INDEX `invitation_guests_phone_number_idx` ON `invitation_guests` (`phone_number`);
--> statement-breakpoint
CREATE INDEX `invitation_guests_opened_idx` ON `invitation_guests` (`invitation_opened_at`);
