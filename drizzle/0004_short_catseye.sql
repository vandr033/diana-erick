CREATE TABLE `invitation_guests` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`name` text NOT NULL,
	`phone_number` text NOT NULL,
	`saturday_only` integer DEFAULT false NOT NULL,
	`custom_message` text,
	`invitation_opened_at` integer,
	`created_at` integer DEFAULT (cast(strftime('%s','now') as integer) * 1000) NOT NULL,
	`updated_at` integer DEFAULT (cast(strftime('%s','now') as integer) * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invitation_guests_token_idx` ON `invitation_guests` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `invitation_guests_phone_number_idx` ON `invitation_guests` (`phone_number`);--> statement-breakpoint
CREATE INDEX `invitation_guests_opened_idx` ON `invitation_guests` (`invitation_opened_at`);--> statement-breakpoint
CREATE TABLE `whatsapp_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`guest_id` text NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`provider_message_id` text,
	`error_message` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`queued_at` integer DEFAULT (cast(strftime('%s','now') as integer) * 1000) NOT NULL,
	`processing_started_at` integer,
	`sent_at` integer,
	`delivered_at` integer,
	`read_at` integer,
	`failed_at` integer,
	`updated_at` integer DEFAULT (cast(strftime('%s','now') as integer) * 1000) NOT NULL,
	FOREIGN KEY (`guest_id`) REFERENCES `invitation_guests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `whatsapp_messages_guest_idx` ON `whatsapp_messages` (`guest_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `whatsapp_messages_provider_message_idx` ON `whatsapp_messages` (`provider_message_id`);--> statement-breakpoint
CREATE INDEX `whatsapp_messages_status_idx` ON `whatsapp_messages` (`status`);