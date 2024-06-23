ALTER TABLE "attachments" RENAME TO "attachment";--> statement-breakpoint
ALTER TABLE "categories" RENAME TO "category";--> statement-breakpoint
ALTER TABLE "courses" RENAME TO "course";--> statement-breakpoint
ALTER TABLE "attachment" DROP CONSTRAINT "attachments_course_id_courses_id_fk";
--> statement-breakpoint
ALTER TABLE "course" DROP CONSTRAINT "courses_category_id_categories_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attachment" ADD CONSTRAINT "attachment_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course" ADD CONSTRAINT "course_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
