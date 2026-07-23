CREATE TABLE IF NOT EXISTS `invitation_guests` (
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
CREATE UNIQUE INDEX IF NOT EXISTS `invitation_guests_token_idx` ON `invitation_guests` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `invitation_guests_phone_number_idx` ON `invitation_guests` (`phone_number`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `invitation_guests_opened_idx` ON `invitation_guests` (`invitation_opened_at`);--> statement-breakpoint
ALTER TABLE `site_settings` ADD `default_whatsapp_message` text DEFAULT 'Hola {name}, nos encantaría que nos acompañes en nuestra boda.

Puedes ver tu invitación y confirmar tu asistencia aquí:
{link}' NOT NULL;
