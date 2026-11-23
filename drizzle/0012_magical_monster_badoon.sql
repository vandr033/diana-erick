ALTER TABLE `invitation_guests` ADD `companions` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `rsvp_responses` ADD `party` text;