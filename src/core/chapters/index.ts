import { Hono } from "hono";
import { Env } from "../..";
import { zValidator } from "@hono/zod-validator";
import { insertChapterSchema } from "../../../db/schema";
import { getAuth } from "@hono/clerk-auth";
import { Entity, Messages } from "../../sharedInfo/message";
import { getDbConnection } from "../../../db/drizzle";
import { z } from "zod";
import { ChapterLogic } from "./logic";
import { CourseLogic } from "../courses/repository";
import Mux from "@mux/mux-node";
import { MuxDataLogic } from "../muxData/logic";

const Chapter = new Hono<{ Bindings: Env }>();

/**
 * チャプター一覧取得API
 */
Chapter.get(
  "/",
  zValidator(
    "param",
    z.object({
      course_id: z.string(),
    })
  ),
  async (c) => {
    // 認証チェック
    const auth = getAuth(c);
    if (!auth?.userId) {
      return c.json({ error: Messages.MSG_ERR_001 }, 401);
    }

    // データベース接続
    const db = getDbConnection(c.env.DATABASE_URL);
    const courseLogic = new CourseLogic(db);
    const chapterLogic = new ChapterLogic(db);

    // 講座の存在チェック
    const { course_id: courseId } = c.req.valid("param");
    const existsCourse = await courseLogic.checkCourseExists(courseId);
    if (!existsCourse) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
    }

    const chapters = await chapterLogic.getChapters(courseId);

    return c.json(chapters);
  }
);

/**
 * チャプター取得API
 */
Chapter.get(
  "/:chapter_id",
  zValidator(
    "param",
    z.object({
      chapter_id: z.string(),
      course_id: z.string(),
    })
  ),
  async (c) => {
    // 認証チェック
    const auth = getAuth(c);
    if (!auth?.userId) {
      return c.json({ error: Messages.MSG_ERR_001 }, 401);
    }

    // パスパラメータを取得
    const { course_id: courseId, chapter_id: chapterId } = c.req.valid("param");

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

    // DBから取得
    const chapter = await chapterLogic.getChapter(chapterId);

    return c.json(chapter);
  }
);

/**
 * チャプター登録API
 */
Chapter.post(
  "/",
  zValidator(
    "param",
    z.object({
      course_id: z.string(),
    })
  ),
  zValidator("json", insertChapterSchema.pick({ title: true })),
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

    // バリデーションチェック
    const validatedData = c.req.valid("json");

    // データベース接続
    const db = getDbConnection(c.env.DATABASE_URL);
    const chapterLogic = new ChapterLogic(db);
    const courseLogic = new CourseLogic(db);

    // 講座の存在チェック
    const { course_id: courseId } = c.req.valid("param");
    const existsCourse = await courseLogic.checkCourseExists(courseId);
    if (!existsCourse) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
    }

    // データベースへの登録
    const chapter = await chapterLogic.registerChapter(validatedData, courseId);

    return c.json(chapter);
  }
);

/**
 * チャプター並び替えAPI
 */
Chapter.put(
  "/reorder",
  zValidator(
    "param",
    z.object({
      course_id: z.string(),
    })
  ),
  zValidator(
    "json",
    z.object({
      list: z.array(
        z.object({
          id: z.string(),
          position: z.number(),
        })
      ),
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

    const { list } = c.req.valid("json");
    const { course_id: courseId } = c.req.valid("param");

    // データベース接続
    const db = getDbConnection(c.env.DATABASE_URL);
    const chapterLogic = new ChapterLogic(db);
    const courseLogic = new CourseLogic(db);

    // 講座の存在チェック
    const existsCourse = await courseLogic.checkCourseExists(courseId);
    if (!existsCourse) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
    }

    // データベースへの更新
    await Promise.all(
      list.map(({ id, position }) =>
        chapterLogic.updateChapter(id, { position })
      )
    );

    return c.json({ status: 200 });
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
