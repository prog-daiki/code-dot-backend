import { Hono } from "hono";
import { Env } from "../..";
import { zValidator } from "@hono/zod-validator";
import { insertChapterSchema } from "../../../db/schema";
import { Entity, Messages } from "../../sharedInfo/message";
import { getDbConnection } from "../../../db/drizzle";
import { z } from "zod";
import { validateAuth } from "../../auth/validateAuth";
import { ChapterUseCase } from "./useCase";
import { HandleError } from "../../error/HandleError";
import { CourseNotFoundError } from "../../error/CourseNotFoundError";
import { ChapterNotFoundError } from "../../error/ChapterNotFoundError";
import { validateAdmin } from "../../auth/validateAdmin";
import { ChapterRequiredFieldsEmptyError } from "../../error/ChapterRequiredFieldsEmptyError";
import { MuxDataNotFoundError } from "../../error/MuxDataNotFoundError";

const Chapter = new Hono<{ Bindings: Env }>();

/**
 * チャプター一覧取得API（管理者）
 */
Chapter.get(
  "/",
  validateAdmin,
  zValidator("param", z.object({ course_id: z.string() })),
  async (c) => {
    try {
      const { course_id: courseId } = c.req.valid("param");
      const db = getDbConnection(c.env.DATABASE_URL);
      const chapterUseCase = new ChapterUseCase(db);
      const chapters = await chapterUseCase.getChapters(courseId);
      return c.json(chapters);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      return HandleError(c, error, "チャプター一覧取得エラー");
    }
  },
);

/**
 * チャプター取得API
 */
Chapter.get(
  "/:chapter_id",
  validateAuth,
  zValidator("param", z.object({ course_id: z.string(), chapter_id: z.string() })),
  async (c) => {
    try {
      const { course_id: courseId, chapter_id: chapterId } = c.req.valid("param");
      const db = getDbConnection(c.env.DATABASE_URL);
      const chapterUseCase = new ChapterUseCase(db);
      const chapter = await chapterUseCase.getChapter(courseId, chapterId);
      return c.json(chapter);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      if (error instanceof ChapterNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.CHAPTER) }, 404);
      }
      return HandleError(c, error, "チャプター取得エラー");
    }
  },
);

/**
 * チャプター登録API
 */
Chapter.post(
  "/",
  validateAdmin,
  zValidator("param", z.object({ course_id: z.string() })),
  zValidator("json", insertChapterSchema.pick({ title: true })),
  async (c) => {
    try {
      const validatedData = c.req.valid("json");
      const { course_id: courseId } = c.req.valid("param");
      const db = getDbConnection(c.env.DATABASE_URL);
      const chapterUseCase = new ChapterUseCase(db);
      const chapter = await chapterUseCase.registerChapter(validatedData.title, courseId);
      return c.json(chapter);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      return HandleError(c, error, "チャプター登録エラー");
    }
  },
);

/**
 * チャプター並び替えAPI
 */
Chapter.put(
  "/reorder",
  validateAdmin,
  zValidator("param", z.object({ course_id: z.string() })),
  zValidator(
    "json",
    z.object({
      list: z.array(z.object({ id: z.string(), position: z.number() })),
    }),
  ),
  async (c) => {
    try {
      const { list } = c.req.valid("json");
      const { course_id: courseId } = c.req.valid("param");
      const db = getDbConnection(c.env.DATABASE_URL);
      const chapterUseCase = new ChapterUseCase(db);
      await chapterUseCase.reorderChapters(courseId, list);
      return c.json({ status: 200 });
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      return HandleError(c, error, "チャプター並び替えエラー");
    }
  },
);

/**
 * チャプタータイトル編集API
 */
Chapter.put(
  "/:chapter_id/title",
  validateAdmin,
  zValidator("param", z.object({ chapter_id: z.string(), course_id: z.string() })),
  zValidator("json", insertChapterSchema.pick({ title: true })),
  async (c) => {
    try {
      const { course_id: courseId, chapter_id: chapterId } = c.req.valid("param");
      const validatedData = c.req.valid("json");
      const db = getDbConnection(c.env.DATABASE_URL);
      const chapterUseCase = new ChapterUseCase(db);
      const chapter = await chapterUseCase.updateChapterTitle(
        validatedData.title,
        courseId,
        chapterId,
      );
      return c.json(chapter);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      if (error instanceof ChapterNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.CHAPTER) }, 404);
      }
      return HandleError(c, error, "チャプタータイトル編集エラー");
    }
  },
);

/**
 * チャプター詳細編集API
 */
Chapter.put(
  "/:chapter_id/description",
  validateAdmin,
  zValidator("param", z.object({ chapter_id: z.string(), course_id: z.string() })),
  zValidator("json", insertChapterSchema.pick({ description: true })),
  async (c) => {
    try {
      const { course_id: courseId, chapter_id: chapterId } = c.req.valid("param");
      const validatedData = c.req.valid("json");
      const db = getDbConnection(c.env.DATABASE_URL);
      const chapterUseCase = new ChapterUseCase(db);
      const chapter = await chapterUseCase.updateChapterDescription(
        validatedData.description,
        courseId,
        chapterId,
      );
      return c.json(chapter);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      if (error instanceof ChapterNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.CHAPTER) }, 404);
      }
      return HandleError(c, error, "チャプター詳細編集エラー");
    }
  },
);

/**
 * チャプターアクセス編集API
 */
Chapter.put(
  "/:chapter_id/access",
  validateAdmin,
  zValidator("param", z.object({ chapter_id: z.string(), course_id: z.string() })),
  zValidator("json", insertChapterSchema.pick({ freeFlag: true })),
  async (c) => {
    try {
      const { course_id: courseId, chapter_id: chapterId } = c.req.valid("param");
      const validatedData = c.req.valid("json");
      const db = getDbConnection(c.env.DATABASE_URL);
      const chapterUseCase = new ChapterUseCase(db);
      const chapter = await chapterUseCase.updateChapterAccess(
        validatedData!.freeFlag!,
        courseId,
        chapterId,
      );
      return c.json(chapter);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      if (error instanceof ChapterNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.CHAPTER) }, 404);
      }
      return HandleError(c, error, "チャプターアクセス編集エラー");
    }
  },
);

/**
 * チャプター動画編集API
 */
Chapter.put(
  "/:chapter_id/video",
  validateAdmin,
  zValidator("param", z.object({ chapter_id: z.string(), course_id: z.string() })),
  zValidator("json", insertChapterSchema.pick({ videoUrl: true })),
  async (c) => {
    try {
      const { course_id: courseId, chapter_id: chapterId } = c.req.valid("param");
      const validatedData = c.req.valid("json");
      const db = getDbConnection(c.env.DATABASE_URL);
      const chapterUseCase = new ChapterUseCase(db);
      const chapter = await chapterUseCase.updateChapterVideo(
        validatedData.videoUrl,
        courseId,
        chapterId,
        c,
      );
      return c.json(chapter);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      if (error instanceof ChapterNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.CHAPTER) }, 404);
      }
      return HandleError(c, error, "チャプター動画編集エラー");
    }
  },
);

/**
 * チャプター削除API
 */
Chapter.delete(
  "/:chapter_id",
  validateAdmin,
  zValidator("param", z.object({ chapter_id: z.string(), course_id: z.string() })),
  async (c) => {
    try {
      const { course_id: courseId, chapter_id: chapterId } = c.req.valid("param");
      const db = getDbConnection(c.env.DATABASE_URL);
      const chapterUseCase = new ChapterUseCase(db);
      const chapter = await chapterUseCase.deleteChapter(courseId, chapterId, c);
      return c.json(chapter);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      if (error instanceof ChapterNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.CHAPTER) }, 404);
      }
      return HandleError(c, error, "チャプター削除エラー");
    }
  },
);

/**
 * チャプター非公開API
 */
Chapter.put(
  "/:chapter_id/unpublish",
  validateAdmin,
  zValidator("param", z.object({ chapter_id: z.string(), course_id: z.string() })),
  async (c) => {
    try {
      const { course_id: courseId, chapter_id: chapterId } = c.req.valid("param");
      const db = getDbConnection(c.env.DATABASE_URL);
      const chapterUseCase = new ChapterUseCase(db);
      const chapter = await chapterUseCase.unpublishChapter(courseId, chapterId);
      return c.json(chapter);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      if (error instanceof ChapterNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.CHAPTER) }, 404);
      }
      return HandleError(c, error, "チャプター非公開エラー");
    }
  },
);

/**
 * チャプター公開API
 */
Chapter.put(
  "/:chapter_id/publish",
  validateAdmin,
  zValidator("param", z.object({ chapter_id: z.string(), course_id: z.string() })),
  async (c) => {
    try {
      const { course_id: courseId, chapter_id: chapterId } = c.req.valid("param");
      const db = getDbConnection(c.env.DATABASE_URL);
      const chapterUseCase = new ChapterUseCase(db);
      const chapter = await chapterUseCase.publishChapter(courseId, chapterId);
      return c.json(chapter);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      if (error instanceof ChapterNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.CHAPTER) }, 404);
      }
      if (error instanceof MuxDataNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.MUXDATA) }, 404);
      }
      if (error instanceof ChapterRequiredFieldsEmptyError) {
        return c.json({ error: Messages.MSG_ERR_004 }, 400);
      }
      return HandleError(c, error, "チャプター公開エラー");
    }
  },
);

export default Chapter;
