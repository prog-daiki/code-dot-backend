import { getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import { getDbConnection } from "../../../db/drizzle";
import { insertCourseSchema } from "../../../db/schema";
import { Env } from "../..";
import { Entity, Messages } from "../../sharedInfo/message";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { CourseLogic } from "./repository";
import { validateAdmin } from "../../auth/validateAdmin";
import { CourseUseCase } from "./useCase";
import { CourseNotFoundError } from "../../error/CourseNotFoundError";
import { HandleError } from "../../error/HandleError";
import { CategoryNotFoundError } from "../../error/CategoryNotFoundError";
import { validateAuth } from "../../auth/validateAuth";

const Course = new Hono<{ Bindings: Env }>();

/**
 * 講座一覧取得API
 */
Course.get("/", async (c) => {
  try {
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

    return c.json(courses);
  } catch (error) {
    console.error("講座一覧取得エラー:", error);
    return c.json({ error: "予期せぬエラーが発生しました" }, 500);
  }
});

/**
 * 講座取得API
 */
Course.get(
  "/:course_id",
  validateAuth,
  zValidator("param", z.object({ course_id: z.string() })),
  async (c) => {
    try {
      const { course_id: courseId } = c.req.valid("param");
      const db = getDbConnection(c.env.DATABASE_URL);
      const courseUseCase = new CourseUseCase(db);
      const course = await courseUseCase.getCourse(courseId);
      return c.json(course);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      return HandleError(c, error, "講座取得エラー");
    }
  }
);

/**
 * 講座登録API
 */
Course.post(
  "/",
  validateAdmin,
  zValidator("json", insertCourseSchema.pick({ title: true })),
  async (c) => {
    try {
      const auth = getAuth(c);
      const validatedData = c.req.valid("json");
      const db = getDbConnection(c.env.DATABASE_URL);
      const courseUseCase = new CourseUseCase(db);
      const course = await courseUseCase.registerCourse(
        validatedData.title,
        auth!.userId!
      );
      return c.json(course);
    } catch (error) {
      return HandleError(c, error, "講座登録エラー");
    }
  }
);

/**
 * 講座タイトル編集API
 */
Course.put(
  "/:course_id/title",
  validateAdmin,
  zValidator("json", insertCourseSchema.pick({ title: true })),
  zValidator("param", z.object({ course_id: z.string() })),
  async (c) => {
    try {
      const validatedData = c.req.valid("json");
      const { course_id: courseId } = c.req.valid("param");
      const db = getDbConnection(c.env.DATABASE_URL);
      const courseUseCase = new CourseUseCase(db);
      const course = await courseUseCase.updateCourseTitle(
        courseId,
        validatedData.title
      );
      return c.json(course);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      return HandleError(c, error, "講座タイトル編集エラー");
    }
  }
);

/**
 * 講座詳細編集API
 */
Course.put(
  "/:course_id/description",
  validateAdmin,
  zValidator("json", insertCourseSchema.pick({ description: true })),
  zValidator("param", z.object({ course_id: z.string() })),
  async (c) => {
    try {
      const validatedData = c.req.valid("json");
      const { course_id: courseId } = c.req.valid("param");
      const db = getDbConnection(c.env.DATABASE_URL);
      const courseUseCase = new CourseUseCase(db);
      const course = await courseUseCase.updateCourseDescription(
        courseId,
        validatedData.description
      );
      return c.json(course);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      return HandleError(c, error, "講座詳細編集エラー");
    }
  }
);

/**
 * 講座サムネイル編集API
 */
Course.put(
  "/:course_id/thumbnail",
  validateAdmin,
  zValidator("json", insertCourseSchema.pick({ imageUrl: true })),
  zValidator("param", z.object({ course_id: z.string() })),
  async (c) => {
    try {
      const validatedData = c.req.valid("json");
      const { course_id: courseId } = c.req.valid("param");
      const db = getDbConnection(c.env.DATABASE_URL);
      const courseUseCase = new CourseUseCase(db);
      const course = await courseUseCase.updateCourseThumbnail(
        courseId,
        validatedData.imageUrl
      );
      return c.json(course);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      return HandleError(c, error, "講座サムネイル編集エラー");
    }
  }
);

/**
 * 講座カテゴリー編集API
 */
Course.put(
  "/:course_id/category",
  validateAdmin,
  zValidator("json", insertCourseSchema.pick({ categoryId: true })),
  zValidator("param", z.object({ course_id: z.string() })),
  async (c) => {
    try {
      const validatedData = c.req.valid("json");
      const { course_id: courseId } = c.req.valid("param");
      const db = getDbConnection(c.env.DATABASE_URL);
      const courseUseCase = new CourseUseCase(db);
      const course = await courseUseCase.updateCourseCategory(
        courseId,
        validatedData.categoryId
      );
      return c.json(course);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      if (error instanceof CategoryNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.CATEGORY) }, 404);
      }
      return HandleError(c, error, "講座カテゴリー編集エラー");
    }
  }
);

/**
 * 講座価格編集API
 */
Course.put(
  "/:course_id/price",
  validateAdmin,
  zValidator("json", insertCourseSchema.pick({ price: true })),
  zValidator("param", z.object({ course_id: z.string() })),
  async (c) => {
    try {
      const validatedData = c.req.valid("json");
      const { course_id: courseId } = c.req.valid("param");
      const db = getDbConnection(c.env.DATABASE_URL);
      const courseUseCase = new CourseUseCase(db);
      const course = await courseUseCase.updateCoursePrice(
        courseId,
        validatedData.price
      );
      return c.json(course);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      return HandleError(c, error, "講座価格編集エラー");
    }
  }
);

/**
 * 講座論理削除API
 */
Course.put(
  "/:course_id/delete",
  validateAdmin,
  zValidator("param", z.object({ course_id: z.string() })),
  async (c) => {
    try {
      const { course_id: courseId } = c.req.valid("param");
      const db = getDbConnection(c.env.DATABASE_URL);
      const courseUseCase = new CourseUseCase(db);
      const course = await courseUseCase.softDeleteCourse(courseId, c);
      return c.json(course);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      return HandleError(c, error, "講座論理削除エラー");
    }
  }
);

/**
 * 講座非公開API
 */
Course.put(
  "/:course_id/unpublish",
  validateAdmin,
  zValidator("param", z.object({ course_id: z.string() })),
  async (c) => {
    try {
      const { course_id: courseId } = c.req.valid("param");
      const db = getDbConnection(c.env.DATABASE_URL);
      const courseUseCase = new CourseUseCase(db);
      const course = await courseUseCase.unpublishCourse(courseId, c);
      return c.json(course);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      return HandleError(c, error, "講座非公開エラー");
    }
  }
);

export default Course;
