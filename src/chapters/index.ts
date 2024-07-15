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

    return c.json(chapters);
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

export default Chapter;
