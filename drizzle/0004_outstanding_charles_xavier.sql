CREATE TABLE IF NOT EXISTS "chapter" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text,
	"description" text,
	"video_url" text,
	"position" integer,
	"publish_flag" boolean DEFAULT false,
	"free_flag" boolean DEFAULT false,
	"course_id" text,
	"create_date" timestamp NOT NULL,
	"update_date" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chapter" ADD CONSTRAINT "chapter_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
