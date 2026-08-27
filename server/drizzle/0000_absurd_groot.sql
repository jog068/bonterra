CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`description` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`type` text NOT NULL,
	`category` text NOT NULL
);
