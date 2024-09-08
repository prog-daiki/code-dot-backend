import { getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import { getDbConnection } from "../../../db/drizzle";
import { insertCourseSchema } from "../../../db/schema";
import { Env } from "../..";
import { Entity, Messages } from "../../sharedInfo/message";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { validateAdmin } from "../../auth/validateAdmin";
import { CourseUseCase } from "./useCase";
import { CourseNotFoundError } from "../../error/CourseNotFoundError";
import { HandleError } from "../../error/HandleError";
import { CategoryNotFoundError } from "../../error/CategoryNotFoundError";
import { validateAuth } from "../../auth/validateAuth";
import { CourseRequiredFieldsEmptyError } from "../../error/CourseRequiredFieldsEmptyError";
import { PurchaseAlreadyExistsError } from "../../error/PurchaseAlreadyExistsError";

const Course = new Hono<{
  Bindings: Env;
  Variables: {
    db: ReturnType<typeof getDbConnection>;
    courseUseCase: CourseUseCase;
  };
}>();
Course.use("*", async (c, next) => {
  const db = getDbConnection(c.env.DATABASE_URL);
  c.set("db", db);
  c.set("courseUseCase", new CourseUseCase(db));
  await next();
});

/**
 * 講座一覧取得API
 */
Course.get("/", validateAdmin, async (c) => {
  const courseUseCase = c.get("courseUseCase");
  try {
    const courses = await courseUseCase.getCourses();
    return c.json(courses);
  } catch (error) {
    return HandleError(c, error, "講座一覧取得エラー");
  }
});

/**
 * 公開講座一覧取得API
 */
Course.get(
  "/publish",
  validateAuth,
  zValidator(
    "query",
    z.object({
      title: z.string().optional(),
      categoryId: z.string().optional(),
    }),
  ),
  async (c) => {
    const db = getDbConnection(c.env.DATABASE_URL);
    const courseUseCase = new CourseUseCase(db);
    const validatedData = c.req.valid("query");
    try {
      const courses = await courseUseCase.getPublishCourses(
        validatedData.title,
        validatedData.categoryId,
      );
      return c.json(courses);
    } catch (error) {
      return HandleError(c, error, "公開講座一覧取得エラー");
    }
  },
);

/**
 * 公開講座取得API
 */
Course.get(
  "/:course_id/publish",
  validateAuth,
  zValidator("param", z.object({ course_id: z.string() })),
  async (c) => {
    const { course_id: courseId } = c.req.valid("param");
    const db = getDbConnection(c.env.DATABASE_URL);
    const courseUseCase = new CourseUseCase(db);
    try {
      const course = await courseUseCase.getPublishCourse(courseId);
      return c.json(course);
    } catch (error) {
      return HandleError(c, error, "公開講座取得エラー");
    }
  },
);

/**
 * 講座取得API（管理者）
 */
Course.get(
  "/:course_id",
  validateAdmin,
  zValidator("param", z.object({ course_id: z.string() })),
  async (c) => {
    const { course_id: courseId } = c.req.valid("param");
    const courseUseCase = c.get("courseUseCase");
    try {
      const course = await courseUseCase.getCourse(courseId);
      return c.json(course);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      return HandleError(c, error, "講座取得エラー");
    }
  },
);

/**
 * 講座登録API
 */
Course.post(
  "/",
  validateAdmin,
  zValidator("json", insertCourseSchema.pick({ title: true })),
  async (c) => {
    const validatedData = c.req.valid("json");
    const courseUseCase = c.get("courseUseCase");
    try {
      const course = await courseUseCase.registerCourse(validatedData.title);
      return c.json(course);
    } catch (error) {
      return HandleError(c, error, "講座登録エラー");
    }
  },
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
    const validatedData = c.req.valid("json");
    const { course_id: courseId } = c.req.valid("param");
    const courseUseCase = c.get("courseUseCase");
    try {
      const course = await courseUseCase.updateCourseTitle(courseId, validatedData.title);
      return c.json(course);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      return HandleError(c, error, "講座タイトル編集エラー");
    }
  },
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
    const validatedData = c.req.valid("json");
    const { course_id: courseId } = c.req.valid("param");
    const courseUseCase = c.get("courseUseCase");
    try {
      const course = await courseUseCase.updateCourseDescription(
        courseId,
        validatedData.description,
      );
      return c.json(course);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      return HandleError(c, error, "講座詳細編集エラー");
    }
  },
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
    const validatedData = c.req.valid("json");
    const { course_id: courseId } = c.req.valid("param");
    const courseUseCase = c.get("courseUseCase");
    try {
      const course = await courseUseCase.updateCourseThumbnail(courseId, validatedData.imageUrl);
      return c.json(course);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      return HandleError(c, error, "講座サムネイル編集エラー");
    }
  },
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
      const course = await courseUseCase.updateCourseCategory(courseId, validatedData.categoryId);
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
  },
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
      const course = await courseUseCase.updateCoursePrice(courseId, validatedData.price);
      return c.json(course);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      return HandleError(c, error, "講座価格編集エラー");
    }
  },
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
  },
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
  },
);

/**
 * 講座公開API
 */
Course.put(
  "/:course_id/publish",
  validateAdmin,
  zValidator("param", z.object({ course_id: z.string() })),
  async (c) => {
    try {
      const { course_id: courseId } = c.req.valid("param");
      const db = getDbConnection(c.env.DATABASE_URL);
      const courseUseCase = new CourseUseCase(db);
      const course = await courseUseCase.publishCourse(courseId);
      return c.json(course);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      if (error instanceof CourseRequiredFieldsEmptyError) {
        return c.json({ error: Messages.MSG_ERR_004 }, 400);
      }
      return HandleError(c, error, "講座公開エラー");
    }
  },
);

/**
 * 講座物理削除API
 */
Course.delete(
  "/:course_id",
  validateAdmin,
  zValidator("param", z.object({ course_id: z.string() })),
  async (c) => {
    try {
      const { course_id: courseId } = c.req.valid("param");
      const db = getDbConnection(c.env.DATABASE_URL);
      const courseUseCase = new CourseUseCase(db);
      const course = await courseUseCase.hardDeleteCourse(courseId, c);
      return c.json(course);
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      }
      return HandleError(c, error, "講座物理削除エラー");
    }
  },
);

/**
 * 講座購入API
 */
Course.post(
  "/:course_id/checkout",
  validateAuth,
  zValidator("param", z.object({ course_id: z.string() })),
  async (c) => {
    try {
      const auth = getAuth(c);
      const emailAddress = (await c.get("clerk").users.getUser(auth!.userId!)).emailAddresses[0]
        .emailAddress;
      const { course_id: courseId } = c.req.valid("param");
      const db = getDbConnection(c.env.DATABASE_URL);
      const courseUseCase = new CourseUseCase(db);
      const url = await courseUseCase.checkoutCourse(courseId, auth!.userId!, emailAddress, c);
      return c.json({ url: url });
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.COURSE) }, 404);
      } else if (error instanceof PurchaseAlreadyExistsError) {
        return c.json({ error: Messages.MSG_ERR_005 }, 400);
      }
      return HandleError(c, error, "講座購入エラー");
    }
  },
);

export default Course;
