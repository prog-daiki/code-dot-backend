import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import { getDbConnection } from "../../db/drizzle";
import { course, insertCourseSchema } from "../../db/schema";
import { Env } from "..";
import { and, eq } from "drizzle-orm";
import { Messages } from "../sharedInfo/message";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { getJstDate } from "../sharedInfo/date";
import { CourseLogic } from "./logic";

const Course = new Hono<{ Bindings: Env }>();

/**
 * 講座一覧取得API
 */
Course.get("/", clerkMiddleware(), async (c) => {
  // 認証チェック
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: Messages.ERR_UNAUTHORIZED }, 401);
  }

  // データベースから取得
  const db = getDbConnection(c.env.DATABASE_URL);
  const data = await db
    .select()
    .from(course)
    .where(and(eq(course.deleteFlag, false), eq(course.publishFlag, true)));

  return c.json({ data });
});

/**
 * 講座取得API
 */
Course.get(
  "/:course_id",
  zValidator(
    "param",
    z.object({
      course_id: z.string().optional(),
    })
  ),
  clerkMiddleware(),
  async (c) => {
    // 認証チェック
    const auth = getAuth(c);
    if (!auth?.userId) {
      return c.json({ error: Messages.ERR_UNAUTHORIZED }, 401);
    }

    // 講座の存在チェック
    const { course_id: courseId } = c.req.valid("param");
    if (!courseId) {
      return c.json({ error: Messages.ERR_COURSE_NOT_FOUND }, 404);
    }

    // データベースから取得
    const db = getDbConnection(c.env.DATABASE_URL);
    const [data] = await db
      .select()
      .from(course)
      .where(
        and(
          eq(course.id, courseId),
          eq(course.deleteFlag, false),
          eq(course.publishFlag, true)
        )
      );

    if (!data) {
      return c.json({ error: Messages.ERR_COURSE_NOT_FOUND }, 404);
    }

    return c.json({ data });
  }
);

/**
 * 講座登録API
 */
Course.post(
  "/",
  zValidator(
    "json",
    insertCourseSchema.pick({
      title: true,
    })
  ),
  async (c) => {
    // 認証チェック
    const auth = getAuth(c);
    if (!auth?.userId) {
      return c.json({ error: Messages.ERR_UNAUTHORIZED }, 401);
    }
    if (auth.userId !== c.env.ADMIN_USER_ID) {
      return c.json({ error: Messages.MSG_ERR_ADMIN_UNAUTHORIZED }, 401);
    }

    // バリデーションチェック
    const values = c.req.valid("json");
    if (!values.title) {
      return c.json({ error: Messages.MSG_ERR_TITLE_REQUIRED }, 400);
    }
    if (values.title.length >= 100) {
      return c.json({ error: Messages.MSG_ERR_TITLE_LIMIT }, 400);
    }

    // データベース接続
    const db = getDbConnection(c.env.DATABASE_URL);

    // データベースへの登録
    const currentJstDate = getJstDate();
    const [data] = await db
      .insert(course)
      .values({
        id: createId(),
        title: values.title,
        userId: auth.userId,
        createDate: currentJstDate,
        updateDate: currentJstDate,
      })
      .returning();

    return c.json({ data });
  }
);

/**
 * 講座タイトル編集API
 */
Course.put(
  "/:course_id/title",
  zValidator(
    "json",
    insertCourseSchema.pick({
      title: true,
    })
  ),
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
      return c.json({ error: Messages.ERR_UNAUTHORIZED }, 401);
    }
    if (auth.userId !== c.env.ADMIN_USER_ID) {
      return c.json({ error: Messages.MSG_ERR_ADMIN_UNAUTHORIZED }, 401);
    }

    // バリデーションチェック
    const values = c.req.valid("json");
    if (!values.title) {
      return c.json({ error: Messages.MSG_ERR_TITLE_REQUIRED }, 400);
    }
    if (values.title.length >= 100) {
      return c.json({ error: Messages.MSG_ERR_TITLE_LIMIT }, 400);
    }

    // データベース接続
    const db = getDbConnection(c.env.DATABASE_URL);
    const courseLogic = new CourseLogic(db);

    // 講座の存在チェック
    const { course_id: courseId } = c.req.valid("param");
    if (!courseId) {
      return c.json({ error: Messages.ERR_COURSE_NOT_FOUND }, 404);
    }
    const isCourseExists = await courseLogic.checkCourseExists(courseId);
    if (!isCourseExists) {
      return c.json({ error: Messages.ERR_COURSE_NOT_FOUND }, 404);
    }

    // データベースへの更新
    const result = await courseLogic.updateCourse(courseId, values);

    return c.json(result);
  }
);

/**
 * 講座詳細編集API
 */
Course.put(
  "/:course_id/description",
  zValidator(
    "json",
    insertCourseSchema.pick({
      description: true,
    })
  ),
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
      return c.json({ error: Messages.ERR_UNAUTHORIZED }, 401);
    }
    if (auth.userId !== c.env.ADMIN_USER_ID) {
      return c.json({ error: Messages.MSG_ERR_ADMIN_UNAUTHORIZED }, 401);
    }

    // バリデーションチェック
    const values = c.req.valid("json");
    if (values.description && values.description.length >= 1000) {
      return c.json({ error: Messages.MSG_ERR_DESCRIPTION_LIMIT }, 400);
    }

    // データベース接続
    const db = getDbConnection(c.env.DATABASE_URL);
    const courseLogic = new CourseLogic(db);

    // 講座の存在チェック
    const { course_id: courseId } = c.req.valid("param");
    if (!courseId) {
      return c.json({ error: Messages.ERR_COURSE_NOT_FOUND }, 404);
    }
    const isCourseExists = await courseLogic.checkCourseExists(courseId);
    if (!isCourseExists) {
      return c.json({ error: Messages.ERR_COURSE_NOT_FOUND }, 404);
    }

    // データベースへの更新
    const result = await courseLogic.updateCourse(courseId, values);

    return c.json(result);
  }
);

export default Course;
