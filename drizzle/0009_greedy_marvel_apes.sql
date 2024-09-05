CREATE TABLE IF NOT EXISTS "stripe_customer" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"stripe_customer_id" text,
	"create_date" timestamp NOT NULL,
	"update_date" timestamp NOT NULL
);
