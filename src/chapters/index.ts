import { Hono } from "hono";
import { Env } from "..";
import { zValidator } from "@hono/zod-validator";
import { insertChapterSchema } from "../../db/schema";
import { getAuth } from "@hono/clerk-auth";
import { Entity, Length, Messages, Property } from "../sharedInfo/message";
import { getDbConnection } from "../../db/drizzle";
import { z } from "zod";
import { ChapterLogic } from "./logic";
import { CourseLogic } from "../courses/logic";

const Chapter = new Hono<{ Bindings: Env }>();

/**
 * チャプター一覧取得API
 */
Chapter.get(
  "/",
  zValidator(
    "param",
    z.object({
      course_id: z.string().optional(),
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
    if (!courseId || !(await courseLogic.checkCourseExists(courseId))) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
    }

    const chapters = await chapterLogic.getChapters(courseId);

    if (auth.userId !== c.env.ADMIN_USER_ID) {
      const filteredChapters = chapters.filter(
        (chapter) => chapter.publishFlag === true
      );
      return c.json(filteredChapters);
    }

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
      chapter_id: z.string().optional(),
      course_id: z.string().optional(),
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
    if (!courseId || !(await courseLogic.checkCourseExists(courseId))) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
    }

    // チャプターの存在チェック
    if (!chapterId || !(await chapterLogic.checkChapterExists(chapterId))) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.CHAPTER) }, 404);
    }

    // DBから取得
    const chapter = await chapterLogic.getChapter(chapterId);

    // チャプターの公開チェック
    const isAdmin = auth.userId === c.env.ADMIN_USER_ID;
    if (!isAdmin && chapter.publishFlag === false) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.CHAPTER) }, 404);
    }

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
      course_id: z.string().optional(),
    })
  ),
  zValidator("json", insertChapterSchema.pick({ title: true })),
  async (c) => {
    // 認証チェック
    const auth = getAuth(c);
    if (!auth?.userId) {
      return c.json({ error: Messages.MSG_ERR_001 }, 401);
    }
    if (auth.userId !== c.env.ADMIN_USER_ID) {
      return c.json({ error: Messages.MSG_ERR_002 }, 401);
    }

    // バリデーションチェック
    const values = c.req.valid("json");
    if (!values.title) {
      return c.json({ error: Messages.MSG_ERR_004(Property.TITLE) }, 400);
    }
    if (values.title.length >= 100) {
      return c.json(
        { error: Messages.MSG_ERR_005(Property.TITLE, Length.TITLE) },
        400
      );
    }

    // データベース接続
    const db = getDbConnection(c.env.DATABASE_URL);
    const chapterLogic = new ChapterLogic(db);
    const courseLogic = new CourseLogic(db);

    // 講座の存在チェック
    const { course_id: courseId } = c.req.valid("param");
    if (!courseId || !(await courseLogic.checkCourseExists(courseId))) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
    }

    // データベースへの登録
    const chapter = await chapterLogic.registerChapter(values, courseId);

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
      course_id: z.string().optional(),
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
    if (auth.userId !== c.env.ADMIN_USER_ID) {
      return c.json({ error: Messages.MSG_ERR_002 }, 401);
    }

    const { list } = c.req.valid("json");
    const { course_id: courseId } = c.req.valid("param");

    // データベース接続
    const db = getDbConnection(c.env.DATABASE_URL);
    const chapterLogic = new ChapterLogic(db);
    const courseLogic = new CourseLogic(db);

    // 講座の存在チェック
    if (!courseId || !(await courseLogic.checkCourseExists(courseId))) {
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
      chapter_id: z.string().optional(),
      course_id: z.string().optional(),
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
    const values = c.req.valid("json");
    if (!values.title) {
      return c.json({ error: Messages.MSG_ERR_004(Property.TITLE) }, 400);
    }
    if (values.title.length > 100) {
      return c.json(
        { error: Messages.MSG_ERR_005(Property.TITLE, Length.TITLE) },
        400
      );
    }

    // データベース接続
    const db = getDbConnection(c.env.DATABASE_URL);
    const courseLogic = new CourseLogic(db);
    const chapterLogic = new ChapterLogic(db);

    // 講座の存在チェック
    if (!courseId || !(await courseLogic.checkCourseExists(courseId))) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
    }

    // チャプターの存在チェック
    if (!chapterId || !(await chapterLogic.checkChapterExists(chapterId))) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.CHAPTER) }, 404);
    }

    const chapter = await chapterLogic.updateChapter(chapterId, values);

    return c.json(chapter);
  }
);

export default Chapter;
