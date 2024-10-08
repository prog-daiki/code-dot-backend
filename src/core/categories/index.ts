import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { insertCategorySchema } from "../../../db/schema";
import { Entity, Messages } from "../../sharedInfo/message";
import { Env } from "../..";
import { getDbConnection } from "../../../db/drizzle";
import { z } from "zod";
import { validateAuth } from "../../auth/validateAuth";
import { CategoryUseCase } from "./useCase";
import { HandleError } from "../../error/HandleError";
import { validateAdmin } from "../../auth/validateAdmin";
import { CategoryNotFoundError } from "../../error/CategoryNotFoundError";

const Category = new Hono<{
  Bindings: Env;
  Variables: {
    db: ReturnType<typeof getDbConnection>;
    categoryUseCase: CategoryUseCase;
  };
}>();
Category.use("*", async (c, next) => {
  const db = getDbConnection(c.env.DATABASE_URL);
  c.set("db", db);
  c.set("categoryUseCase", new CategoryUseCase(db));
  await next();
});

/**
 * カテゴリー一覧取得API
 */
Category.get("/", validateAuth, async (c) => {
  const categoryUseCase = c.get("categoryUseCase");
  try {
    const categories = await categoryUseCase.getCategories();
    return c.json(categories);
  } catch (error) {
    return HandleError(c, error, "カテゴリー一覧取得エラー");
  }
});

/**
 * カテゴリー登録API
 */
Category.post(
  "/",
  validateAdmin,
  zValidator("json", insertCategorySchema.pick({ name: true })),
  async (c) => {
    const validatedData = c.req.valid("json");
    const categoryUseCase = c.get("categoryUseCase");
    try {
      const category = await categoryUseCase.registerCategory(validatedData.name);
      return c.json(category);
    } catch (error) {
      return HandleError(c, error, "カテゴリー登録エラー");
    }
  },
);

/**
 * カテゴリー編集API
 */
Category.put(
  "/:category_id",
  validateAdmin,
  zValidator("json", insertCategorySchema.pick({ name: true })),
  zValidator("param", z.object({ category_id: z.string() })),
  async (c) => {
    const { category_id: categoryId } = c.req.valid("param");
    const validatedData = c.req.valid("json");
    const categoryUseCase = c.get("categoryUseCase");
    try {
      const category = await categoryUseCase.updateCategory(categoryId, validatedData.name);
      return c.json(category);
    } catch (error) {
      if (error instanceof CategoryNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.CATEGORY) }, 404);
      }
      return HandleError(c, error, "カテゴリー編集エラー");
    }
  },
);

/**
 * カテゴリー削除API
 */
Category.delete(
  "/:category_id",
  validateAdmin,
  zValidator("param", z.object({ category_id: z.string() })),
  async (c) => {
    const { category_id: categoryId } = c.req.valid("param");
    const categoryUseCase = c.get("categoryUseCase");
    try {
      const category = await categoryUseCase.deleteCategory(categoryId);
      return c.json(category);
    } catch (error) {
      if (error instanceof CategoryNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.CATEGORY) }, 404);
      }
      return HandleError(c, error, "カテゴリー削除エラー");
    }
  },
);

export default Category;
