DROP INDEX `invitation_guests_phone_number_idx`;--> statement-breakpoint
ALTER TABLE `invitation_guests` ADD `phase` text DEFAULT 'save-the-date' NOT NULL;--> statement-breakpoint
ALTER TABLE `invitation_guests` ADD `source_response_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `invitation_guests_phase_phone_idx` ON `invitation_guests` (`phase`,`phone_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `invitation_guests_source_response_idx` ON `invitation_guests` (`source_response_id`);--> statement-breakpoint
ALTER TABLE `rsvp_responses` ADD `phase` text DEFAULT 'save-the-date' NOT NULL;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `final_invitation_details` text DEFAULT '' NOT NULL;