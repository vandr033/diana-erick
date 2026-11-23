ALTER TABLE `invitation_guests` ADD `source_guest_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `invitation_guests_source_guest_idx` ON `invitation_guests` (`source_guest_id`);