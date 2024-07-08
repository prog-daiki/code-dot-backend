import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import { getDbConnection } from "../../db/drizzle";
import { insertCourseSchema } from "../../db/schema";
import { Env } from "..";
import { Entity, Length, Messages } from "../sharedInfo/message";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { CourseLogic } from "./logic";

const Course = new Hono<{ Bindings: Env }>();

/**
 * 講座一覧取得API
 */
Course.get("/", clerkMiddleware(), async (c) => {
  // 認証チェック
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: Messages.MSG_ERR_001 }, 401);
  }

  // データベース接続
  const db = getDbConnection(c.env.DATABASE_URL);
  const courseLogic = new CourseLogic(db);

  // データベースから取得
  const courses = await courseLogic.getCourses();

  if (auth.userId !== c.env.ADMIN_USER_ID) {
    const filteredCourses = courses.filter(
      (course) => course.deleteFlag === false && course.publishFlag === true
    );
    return c.json(filteredCourses);
  }

  return c.json(courses);
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
  async (c) => {
    // 認証チェック
    const auth = getAuth(c);
    if (!auth?.userId) {
      return c.json({ error: Messages.MSG_ERR_001 }, 401);
    }

    // データベース接続
    const db = getDbConnection(c.env.DATABASE_URL);
    const courseLogic = new CourseLogic(db);

    // 講座の存在チェック
    const { course_id: courseId } = c.req.valid("param");
    if (!courseId || !(await courseLogic.checkCourseExists(courseId))) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
    }

    // データベースから取得
    const course = await courseLogic.getCourse(courseId);

    // 講座の削除・公開チェック
    if (
      (course.deleteFlag || !course.publishFlag) &&
      auth.userId !== c.env.ADMIN_USER_ID
    ) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
    }

    return c.json(course);
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
      return c.json({ error: Messages.MSG_ERR_001 }, 401);
    }
    if (auth.userId !== c.env.ADMIN_USER_ID) {
      return c.json({ error: Messages.MSG_ERR_002 }, 401);
    }

    // バリデーションチェック
    const values = c.req.valid("json");
    if (!values.title) {
      return c.json({ error: Messages.MSG_ERR_004(Entity.COURSE) }, 400);
    }
    if (values.title.length >= 100) {
      return c.json(
        { error: Messages.MSG_ERR_005(Entity.COURSE, Length.TITLE) },
        400
      );
    }

    // データベース接続
    const db = getDbConnection(c.env.DATABASE_URL);
    const courseLogic = new CourseLogic(db);

    // データベースへの登録
    const course = await courseLogic.registerCourse(values, auth.userId);

    return c.json(course);
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

/**
 * 講座サムネイル編集API
 */
Course.put(
  "/:course_id/thumbnail",
  zValidator(
    "json",
    insertCourseSchema.pick({
      imageUrl: true,
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
    if (!values.imageUrl) {
      return c.json({ error: Messages.MSG_ERR_IMAGE_URL_REQUIRED }, 400);
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
 * 講座カテゴリー編集API
 */
Course.put(
  "/:course_id/category",
  zValidator(
    "json",
    insertCourseSchema.pick({
      categoryId: true,
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
    if (!values.categoryId) {
      return c.json({ error: Messages.MSG_ERR_CATEGORY_REQUIRED }, 400);
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
