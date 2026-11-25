ALTER TABLE `invitation_guests` ADD `transport_included` integer DEFAULT true NOT NULL;
UPDATE `invitation_guests` SET `transport_included` = 0 WHERE `phase` = 'final' AND `saturday_only` = 1;
