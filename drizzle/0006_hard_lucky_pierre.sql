CREATE TABLE IF NOT EXISTS "mux_data" (
	"id" text PRIMARY KEY NOT NULL,
	"asset_id" text,
	"playback_id" text,
	"chapter_id" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mux_data" ADD CONSTRAINT "mux_data_chapter_id_chapter_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapter"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
