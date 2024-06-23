import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const category = pgTable("category", {
  id: text("id").primaryKey(),
  name: text("name"),
});

export const course = pgTable("course", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  price: integer("price"),
  userId: text("user_id"),
  publishFlag: boolean("publish_flag").default(false),
  deleteFlag: boolean("delete_flag").default(false),
  categoryId: text("category_id").references(() => category.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
});

export const attachment = pgTable("attachment", {
  id: text("id").primaryKey(),
  name: text("name"),
  url: text("url"),
  courseId: text("course_id").references(() => course.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
});

export const courseRelations = relations(course, ({ many }) => ({
  categories: many(category),
  attachments: many(attachment),
}));

export const categoriesRelations = relations(category, ({ many }) => ({
  courses: many(course),
}));

export const attachmentsRelations = relations(attachment, ({ one }) => ({
  course: one(course, {
    fields: [attachment.courseId],
    references: [course.id],
  }),
}));

export const insertCourseSchema = createInsertSchema(course);
