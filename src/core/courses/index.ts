import { getAuth } from "@hono/clerk-auth";
import { Context, Hono } from "hono";
import { getDbConnection } from "../../../db/drizzle";
import { insertCourseSchema } from "../../../db/schema";
import { Env } from "../..";
import { Entity, Messages, Property } from "../../sharedInfo/message";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { CourseLogic } from "./logic";
import { CategoryLogic } from "../categories/logic";
import { validateAdmin } from "../../auth/validateAdmin";
import { CourseUseCase } from "./useCase";
import { CourseNotFoundError } from "../../error/CourseNotFoundError";
import { HandleError } from "../../error/HandleError";

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
  zValidator(
    "param",
    z.object({
      course_id: z.string(),
    })
  ),
  async (c) => {
    try {
      // 認証チェック
      const auth = getAuth(c);
      if (!auth?.userId) {
        return c.json({ error: Messages.MSG_ERR_001 }, 401);
      }

      // パスパラメータの取得
      const { course_id: courseId } = c.req.valid("param");

      // データベース接続
      const db = getDbConnection(c.env.DATABASE_URL);
      const courseLogic = new CourseLogic(db);

      // 講座の存在チェック
      const existsCourse = await courseLogic.checkCourseExists(courseId);
      if (!existsCourse) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }

      // データベースから取得
      const course = await courseLogic.getCourse(courseId);

      return c.json(course);
    } catch (error) {
      console.error("講座取得エラー:", error);
      return c.json({ error: "予期せぬエラーが発生しました" }, 500);
    }
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
    try {
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
      const courseLogic = new CourseLogic(db);

      // データベースへの登録
      const course = await courseLogic.registerCourse(
        validatedData,
        auth.userId
      );

      return c.json(course);
    } catch (error) {
      console.error("講座登録エラー:", error);
      return c.json({ error: "予期せぬエラーが発生しました" }, 500);
    }
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
      course_id: z.string(),
    })
  ),
  async (c) => {
    try {
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
      const courseLogic = new CourseLogic(db);

      // 講座の存在チェック
      const { course_id: courseId } = c.req.valid("param");
      const existsCourse = await courseLogic.checkCourseExists(courseId);
      if (!existsCourse) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }

      // データベースへの更新
      const course = await courseLogic.updateCourse(courseId, validatedData);

      return c.json(course);
    } catch (error) {
      console.error("講座タイトル編集エラー:", error);
      return c.json({ error: "予期せぬエラーが発生しました" }, 500);
    }
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
      course_id: z.string(),
    })
  ),
  async (c) => {
    try {
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
      const courseLogic = new CourseLogic(db);

      // 講座の存在チェック
      const { course_id: courseId } = c.req.valid("param");
      const existsCourse = await courseLogic.checkCourseExists(courseId);
      if (!existsCourse) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }

      // データベースへの更新
      const course = await courseLogic.updateCourse(courseId, validatedData);

      return c.json(course);
    } catch (error) {
      console.error("講座詳細編集エラー:", error);
      return c.json({ error: "予期せぬエラーが発生しました" }, 500);
    }
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
      course_id: z.string(),
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

    // バリデーションチェック
    const validatedData = c.req.valid("json");

    // データベース接続
    const db = getDbConnection(c.env.DATABASE_URL);
    const courseLogic = new CourseLogic(db);

    // 講座の存在チェック
    const { course_id: courseId } = c.req.valid("param");
    const existsCourse = await courseLogic.checkCourseExists(courseId);
    if (!existsCourse) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
    }

    // データベースへの更新
    const course = await courseLogic.updateCourse(courseId, validatedData);

    return c.json(course);
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
      course_id: z.string(),
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

    // バリデーションチェック
    const values = c.req.valid("json");
    if (!values.categoryId) {
      return c.json({ error: Messages.MSG_ERR_004(Property.CATEGORY_ID) }, 400);
    }

    // データベース接続
    const db = getDbConnection(c.env.DATABASE_URL);
    const courseLogic = new CourseLogic(db);
    const categoryLogic = new CategoryLogic(db);

    // 講座の存在チェック
    const { course_id: courseId } = c.req.valid("param");
    const existsCourse = await courseLogic.checkCourseExists(courseId);
    if (!existsCourse) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
    }

    // カテゴリーの存在チェック
    const existsCategory = await categoryLogic.checkCategoryExists(
      values.categoryId
    );
    if (!existsCategory) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.CATEGORY) }, 404);
    }

    // データベースへの更新
    const result = await courseLogic.updateCourse(courseId, values);

    return c.json(result);
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
