ALTER TABLE `site_settings` ADD `hotel_name` text DEFAULT 'Hotel recomendado' NOT NULL;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `hotel_location_url` text DEFAULT 'https://maps.google.com' NOT NULL;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `transport_message` text DEFAULT 'Para su comodidad, habrá transporte desde {hotel} hacia {eventos}. Si se hospedan en otro lugar, les pedimos coordinar su traslado a {hotel} o llegar directamente al lugar de cada evento.' NOT NULL;
