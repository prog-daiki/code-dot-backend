import { relations } from "drizzle-orm";
import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const category = pgTable("category", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const course = pgTable("course", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  price: integer("price"),
  sourceUrl: text("source_url"),
  publishFlag: boolean("publish_flag").default(false),
  categoryId: text("category_id").references(() => category.id, {
    onDelete: "set null",
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

export const muxData = pgTable("mux_data", {
  id: text("id").primaryKey(),
  assetId: text("asset_id").notNull(),
  playbackId: text("playback_id"),
  chapterId: text("chapter_id").references(() => chapter.id, {
    onDelete: "cascade",
  }),
});

export const purchase = pgTable("purchase", {
  id: text("id").primaryKey(),
  courseId: text("course_id").references(() => course.id, {
    onDelete: "cascade",
  }),
  userId: text("user_id"),
  createDate: timestamp("create_date", { mode: "date" }).notNull(),
  updateDate: timestamp("update_date", { mode: "date" }).notNull(),
});

export const purchaseHistory = pgTable("purchase_history", {
  id: text("id").primaryKey(),
  courseId: text("course_id").references(() => course.id),
  courseTitle: text("course_title"),
  userId: text("user_id"),
  createDate: timestamp("create_date", { mode: "date" }).notNull(),
  updateDate: timestamp("update_date", { mode: "date" }).notNull(),
});

export const stripeCustomer = pgTable("stripe_customer", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  createDate: timestamp("create_date", { mode: "date" }).notNull(),
  updateDate: timestamp("update_date", { mode: "date" }).notNull(),
});

export const courseRelations = relations(course, ({ many }) => ({
  categories: many(category),
  chapters: many(chapter),
}));

export const categoriesRelations = relations(category, ({ many }) => ({
  courses: many(course),
}));

export const chaptersRelations = relations(chapter, ({ one }) => ({
  course: one(course, {
    fields: [chapter.courseId],
    references: [course.id],
  }),
}));

export const muxDataRelations = relations(muxData, ({ one }) => ({
  chapter: one(chapter, {
    fields: [muxData.chapterId],
    references: [chapter.id],
  }),
}));

export const purchaseRelations = relations(purchase, ({ one }) => ({
  course: one(course, {
    fields: [purchase.courseId],
    references: [course.id],
  }),
}));

export const insertCourseSchema = createInsertSchema(course).extend({
  title: z.string().min(1, "タイトルは1文字以上です").max(100, "タイトルは100文字以内です"),
  description: z.string().min(1, "詳細は1文字以上です").max(1000, "詳細は1000文字以内です"),
  imageUrl: z.string().url("有効なURLを入力してください").min(1, "サムネイルは必須です"),
  price: z
    .number()
    .int("価格は整数である必要があります")
    .min(0, "価格は0以上の整数である必要があります")
    .max(1000000, "価格は100万以下の整数である必要があります")
    .or(z.string().regex(/^\d+$/, "価格は数字のみである必要があります").transform(Number)),
  categoryId: z.string().min(1, "カテゴリーIDは必須です"),
});

export const insertCategorySchema = createInsertSchema(category).extend({
  name: z
    .string()
    .min(1, "カテゴリー名は1文字以上です")
    .max(100, "カテゴリー名は100文字以内です")
    .regex(/^[\p{L}\p{N}\s\-_.,]+$/u, "カテゴリー名に無効な文字が含まれています"),
});

export const insertChapterSchema = createInsertSchema(chapter).extend({
  title: z.string().min(1, "タイトルは1文字以上です").max(100, "タイトルは100文字以内です"),
  description: z.string().min(1, "詳細は1文字以上です").max(1000, "詳細は1000文字以内です"),
  videoUrl: z.string().min(1, "動画URLは必須です").url("有効なURLを入力してください"),
});
