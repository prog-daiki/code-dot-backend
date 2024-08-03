import { Hono } from "hono";
import { Env } from "../..";
import { zValidator } from "@hono/zod-validator";
import { insertChapterSchema } from "../../../db/schema";
import { getAuth } from "@hono/clerk-auth";
import { Entity, Messages } from "../../sharedInfo/message";
import { getDbConnection } from "../../../db/drizzle";
import { z } from "zod";
import { ChapterLogic } from "./repository";
import { CourseLogic } from "../courses/repository";
import Mux from "@mux/mux-node";
import { MuxDataLogic } from "../muxData/logic";
import { validateAuth } from "../../auth/validateAuth";
import { ChapterUseCase } from "./useCase";
import { HandleError } from "../../error/HandleError";
import { CourseNotFoundError } from "../../error/CourseNotFoundError";
import { ChapterNotFoundError } from "../../error/ChapterNotFoundError";
import { validateAdmin } from "../../auth/validateAdmin";

const Chapter = new Hono<{ Bindings: Env }>();

/**
 * チャプター一覧取得API
 */
Chapter.get(
  "/",
  validateAuth,
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
  }
);

/**
 * チャプター取得API
 */
Chapter.get(
  "/:chapter_id",
  validateAuth,
  zValidator(
    "param",
    z.object({ chapter_id: z.string(), course_id: z.string() })
  ),
  async (c) => {
    try {
      const { course_id: courseId, chapter_id: chapterId } =
        c.req.valid("param");
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
  }
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
      const chapter = await chapterUseCase.registerChapter(
        validatedData.title,
        courseId
      );
      return c.json(chapter);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      return HandleError(c, error, "チャプター登録エラー");
    }
  }
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
    })
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
  }
);

/**
 * チャプタータイトル編集API
 */
Chapter.put(
  "/:chapter_id/title",
  zValidator(
    "param",
    z.object({
      chapter_id: z.string(),
      course_id: z.string(),
    })
  ),
  zValidator(
    "json",
    insertChapterSchema.pick({
      title: true,
    })
  ),
  async (c) => {
    // 認証チェック
    const auth = getAuth(c);
    if (!auth?.userId) {
      return c.json({ error: Messages.MSG_ERR_001 }, 401);
    }
    const isAdmin = auth.userId === c.env.ADMIN_USER_ID;
    if (!isAdmin) {
      return c.json({ error: Messages.MSG_ERR_002 }, 401);
    }

    // パスパラメータを取得
    const { course_id: courseId, chapter_id: chapterId } = c.req.valid("param");

    // バリデーションチェック
    const validatedData = c.req.valid("json");

    // データベース接続
    const db = getDbConnection(c.env.DATABASE_URL);
    const courseLogic = new CourseLogic(db);
    const chapterLogic = new ChapterLogic(db);

    // 講座の存在チェック
    const existsCourse = await courseLogic.checkCourseExists(courseId);
    if (!existsCourse) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
    }

    // チャプターの存在チェック
    const existsChapter = await chapterLogic.checkChapterExists(chapterId);
    if (!existsChapter) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.CHAPTER) }, 404);
    }

    const chapter = await chapterLogic.updateChapter(chapterId, validatedData);

    return c.json(chapter);
  }
);

/**
 * チャプター詳細編集API
 */
Chapter.put(
  "/:chapter_id/description",
  zValidator(
    "param",
    z.object({
      chapter_id: z.string(),
      course_id: z.string(),
    })
  ),
  zValidator(
    "json",
    insertChapterSchema.pick({
      description: true,
    })
  ),
  async (c) => {
    // 認証チェック
    const auth = getAuth(c);
    if (!auth?.userId) {
      return c.json({ error: Messages.MSG_ERR_001 }, 401);
    }
    const isAdmin = auth.userId === c.env.ADMIN_USER_ID;
    if (!isAdmin) {
      return c.json({ error: Messages.MSG_ERR_002 }, 401);
    }

    // パスパラメータを取得
    const { course_id: courseId, chapter_id: chapterId } = c.req.valid("param");

    // バリデーションチェック
    const validatedData = c.req.valid("json");

    // データベース接続
    const db = getDbConnection(c.env.DATABASE_URL);
    const courseLogic = new CourseLogic(db);
    const chapterLogic = new ChapterLogic(db);

    // 講座の存在チェック
    const existsCourse = await courseLogic.checkCourseExists(courseId);
    if (!existsCourse) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
    }

    // チャプターの存在チェック
    const existsChapter = await chapterLogic.checkChapterExists(chapterId);
    if (!existsChapter) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.CHAPTER) }, 404);
    }

    const chapter = await chapterLogic.updateChapter(chapterId, validatedData);

    return c.json(chapter);
  }
);

/**
 * チャプターアクセス編集API
 */
Chapter.put(
  "/:chapter_id/access",
  zValidator(
    "param",
    z.object({
      chapter_id: z.string(),
      course_id: z.string(),
    })
  ),
  zValidator(
    "json",
    insertChapterSchema.pick({
      freeFlag: true,
    })
  ),
  async (c) => {
    // 認証チェック
    const auth = getAuth(c);
    if (!auth?.userId) {
      return c.json({ error: Messages.MSG_ERR_001 }, 401);
    }
    const isAdmin = auth.userId === c.env.ADMIN_USER_ID;
    if (!isAdmin) {
      return c.json({ error: Messages.MSG_ERR_002 }, 401);
    }

    // パスパラメータを取得
    const { course_id: courseId, chapter_id: chapterId } = c.req.valid("param");

    // バリデーションチェック
    const validatedData = c.req.valid("json");

    // データベース接続
    const db = getDbConnection(c.env.DATABASE_URL);
    const courseLogic = new CourseLogic(db);
    const chapterLogic = new ChapterLogic(db);

    // 講座の存在チェック
    const existsCourse = await courseLogic.checkCourseExists(courseId);
    if (!existsCourse) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
    }

    // チャプターの存在チェック
    const existsChapter = await chapterLogic.checkChapterExists(chapterId);
    if (!existsChapter) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.CHAPTER) }, 404);
    }

    const chapter = await chapterLogic.updateChapter(chapterId, validatedData);

    return c.json(chapter);
  }
);

/**
 * チャプター動画編集API
 */
Chapter.put(
  "/:chapter_id/video",
  zValidator(
    "param",
    z.object({
      chapter_id: z.string(),
      course_id: z.string(),
    })
  ),
  zValidator(
    "json",
    insertChapterSchema.pick({
      videoUrl: true,
    })
  ),
  async (c) => {
    // 認証チェック
    const auth = getAuth(c);
    if (!auth?.userId) {
      return c.json({ error: Messages.MSG_ERR_001 }, 401);
    }
    const isAdmin = auth.userId === c.env.ADMIN_USER_ID;
    if (!isAdmin) {
      return c.json({ error: Messages.MSG_ERR_002 }, 401);
    }

    // パスパラメータを取得
    const { course_id: courseId, chapter_id: chapterId } = c.req.valid("param");

    // バリデーションチェック
    const validatedData = c.req.valid("json");

    // データベース接続
    const db = getDbConnection(c.env.DATABASE_URL);
    const courseLogic = new CourseLogic(db);
    const chapterLogic = new ChapterLogic(db);
    const muxDataLogic = new MuxDataLogic(db);

    // 講座の存在チェック
    const existsCourse = await courseLogic.checkCourseExists(courseId);
    if (!existsCourse) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
    }

    // チャプターの存在チェック
    const existsChapter = await chapterLogic.checkChapterExists(chapterId);
    if (!existsChapter) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.CHAPTER) }, 404);
    }

    const { video } = new Mux({
      tokenId: c.env.MUX_TOKEN_ID!,
      tokenSecret: c.env.MUX_TOKEN_SECRET!,
    });

    // muxDataの存在チェック
    const existsMuxData = await muxDataLogic.checkMuxDataExists(chapterId);
    if (existsMuxData) {
      await video.assets.delete(existsMuxData.assetId);
      await muxDataLogic.deleteMuxData(chapterId);
    }

    const asset = await video.assets.create({
      input: validatedData.videoUrl as any,
      playback_policy: ["public"],
      test: false,
    });

    await muxDataLogic.registerMuxData(
      chapterId,
      asset.id,
      asset.playback_ids![0].id
    );
    const chapter = await chapterLogic.updateChapter(chapterId, validatedData);

    return c.json(chapter);
  }
);

export default Chapter;
