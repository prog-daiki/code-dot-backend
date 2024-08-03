import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { insertCategorySchema } from "../../../db/schema";
import { getAuth } from "@hono/clerk-auth";
import { Entity, Messages } from "../../sharedInfo/message";
import { Env } from "../..";
import { getDbConnection } from "../../../db/drizzle";
import { CategoryLogic } from "./repository";
import { z } from "zod";
import { validateAuth } from "../../auth/validateAuth";
import { CategoryUseCase } from "./useCase";
import { HandleError } from "../../error/HandleError";
import { validateAdmin } from "../../auth/validateAdmin";
import { CategoryNotFoundError } from "../../error/CategoryNotFoundError";

const Category = new Hono<{ Bindings: Env }>();

/**
 * カテゴリー一覧取得API
 */
Category.get("/", validateAuth, async (c) => {
  try {
    const db = getDbConnection(c.env.DATABASE_URL);
    const categoryUseCase = new CategoryUseCase(db);
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
    try {
      const validatedData = c.req.valid("json");
      const db = getDbConnection(c.env.DATABASE_URL);
      const categoryUseCase = new CategoryUseCase(db);
      const category = await categoryUseCase.registerCategory(
        validatedData.name
      );
      return c.json(category);
    } catch (error) {
      return HandleError(c, error, "カテゴリー登録エラー");
    }
  }
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
    try {
      const { category_id: categoryId } = c.req.valid("param");
      const validatedData = c.req.valid("json");
      const db = getDbConnection(c.env.DATABASE_URL);
      const categoryUseCase = new CategoryUseCase(db);
      const category = await categoryUseCase.updateCategory(
        categoryId,
        validatedData.name
      );
      return c.json(category);
    } catch (error) {
      if (error instanceof CategoryNotFoundError) {
        return c.json({ error: Messages.MSG_ERR_003(Entity.CATEGORY) }, 404);
      }
      return HandleError(c, error, "カテゴリー編集エラー");
    }
  }
);

/**
 * カテゴリー削除API
 */
Category.delete(
  "/:category_id",
  zValidator(
    "param",
    z.object({
      category_id: z.string(),
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
    const { category_id: categoryId } = c.req.valid("param");

    // データベース接続
    const db = getDbConnection(c.env.DATABASE_URL);
    const categoryLogic = new CategoryLogic(db);

    // カテゴリーの存在チェック
    const existsCategory = await categoryLogic.checkCategoryExists(categoryId);
    if (!existsCategory) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.CATEGORY) }, 404);
    }

    // データベースへの削除
    const category = await categoryLogic.deleteCategory(categoryId);

    return c.json(category);
  }
);

export default Category;
