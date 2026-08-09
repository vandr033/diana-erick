ALTER TABLE `rsvp_responses` ADD `invitation_guest_id` text;--> statement-breakpoint
CREATE INDEX `rsvp_invitation_guest_idx` ON `rsvp_responses` (`invitation_guest_id`);