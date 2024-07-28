import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  userId: text("user_id").notNull(),
  publishFlag: boolean("publish_flag").default(false),
  deleteFlag: boolean("delete_flag").default(false),
  categoryId: text("category_id").references(() => category.id, {
    onDelete: "set null",
  }),
  createDate: timestamp("create_date", { mode: "date" }).notNull(),
  updateDate: timestamp("update_date", { mode: "date" }).notNull(),
});

export const attachment = pgTable("attachment", {
  id: text("id").primaryKey(),
  name: text("name"),
  url: text("url"),
  courseId: text("course_id").references(() => course.id, {
    onDelete: "cascade",
  }),
  createDate: timestamp("create_date", { mode: "date" }).notNull(),
  updateDate: timestamp("update_date", { mode: "date" }).notNull(),
});

export const chapter = pgTable("chapter", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url"),
  position: integer("position").notNull(),
  publishFlag: boolean("publish_flag").default(false),
  freeFlag: boolean("free_flag").default(false),
  courseId: text("course_id").references(() => course.id, {
    onDelete: "cascade",
  }),
  createDate: timestamp("create_date", { mode: "date" }).notNull(),
  updateDate: timestamp("update_date", { mode: "date" }).notNull(),
});

export const courseRelations = relations(course, ({ many }) => ({
  categories: many(category),
  attachments: many(attachment),
  chapters: many(chapter),
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

export const chaptersRelations = relations(chapter, ({ one }) => ({
  course: one(course, {
    fields: [chapter.courseId],
    references: [course.id],
  }),
}));

export const insertCourseSchema = createInsertSchema(course).extend({
  title: z
    .string()
    .min(1, "タイトルは1文字以上です")
    .max(100, "タイトルは100文字以内です")
    .regex(/^[\p{L}\p{N}\s\-_.,]+$/u, "タイトルに無効な文字が含まれています"),
  description: z
    .string()
    .min(1, "詳細は1文字以上です")
    .max(100, "詳細は100文字以内です")
    .regex(/^[\p{L}\p{N}\s\-_.,]+$/u, "詳細に無効な文字が含まれています"),
  imageUrl: z
    .string()
    .url("有効なURLを入力してください")
    .min(1, "サムネイルは必須です"),
  price: z
    .number()
    .int()
    .min(1, "価格は1以上の整数である必要があります")
    .max(1000000, "価格は100万以下である必要があります"),
});

export const insertCategorySchema = createInsertSchema(category).extend({
  name: z
    .string()
    .min(1, "カテゴリー名は1文字以上です")
    .max(100, "カテゴリー名は100文字以内です")
    .regex(
      /^[\p{L}\p{N}\s\-_.,]+$/u,
      "カテゴリー名に無効な文字が含まれています"
    ),
});

export const insertChapterSchema = createInsertSchema(chapter).extend({
  title: z
    .string()
    .min(1, "タイトルは1文字以上です")
    .max(100, "タイトルは100文字以内です")
    .regex(/^[\p{L}\p{N}\s\-_.,]+$/u, "タイトルに無効な文字が含まれています"),
});
