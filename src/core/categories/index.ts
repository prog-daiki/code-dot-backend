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
  zValidator(
    "json",
    insertCategorySchema.pick({
      name: true,
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
    const categoryLogic = new CategoryLogic(db);

    // データベースへの登録
    const category = await categoryLogic.registerCategory(validatedData);

    return c.json(category);
  }
);

/**
 * カテゴリー編集API
 */
Category.put(
  "/:category_id",
  zValidator(
    "json",
    insertCategorySchema.pick({
      name: true,
    })
  ),
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

    // リクエストパラメータを取得
    const validatedData = c.req.valid("json");

    // データベース接続
    const db = getDbConnection(c.env.DATABASE_URL);
    const categoryLogic = new CategoryLogic(db);

    // カテゴリーの存在チェック
    const existsCategory = await categoryLogic.checkCategoryExists(categoryId);
    if (!existsCategory) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.CATEGORY) }, 404);
    }

    // データベースへの更新
    const category = await categoryLogic.updateCategory(
      categoryId,
      validatedData
    );

    return c.json(category);
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
