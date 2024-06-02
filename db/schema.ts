import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name"),
});

export const courses = pgTable("courses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  price: integer("price"),
  userId: text("user_id"),
  publishFlag: boolean("publish_flag").default(false),
  deleteFlag: boolean("delete_flag").default(false),
  categoryId: text("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
});

export const attachments = pgTable("attachments", {
  id: text("id").primaryKey(),
  name: text("name"),
  url: text("url"),
  courseId: text("course_id").references(() => courses.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
});

export const coursesRelations = relations(courses, ({ many }) => ({
  categories: many(categories),
  attachments: many(attachments),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  courses: many(courses),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  course: one(courses, {
    fields: [attachments.courseId],
    references: [courses.id],
  }),
}));

export const insertCourseSchema = createInsertSchema(courses);
