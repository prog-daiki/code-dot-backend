import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { insertCategorySchema } from "../../db/schema";
import { getAuth } from "@hono/clerk-auth";
import { Entity, Length, Messages, Property } from "../sharedInfo/message";
import { Env } from "..";
import { getDbConnection } from "../../db/drizzle";
import { CategoryLogic } from "./logic";
import { z } from "zod";

const Category = new Hono<{ Bindings: Env }>();

/**
 * カテゴリー一覧取得API
 */
Category.get("/", async (c) => {
  // 認証チェック
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: Messages.MSG_ERR_001 }, 401);
  }

  // データベース接続
  const db = getDbConnection(c.env.DATABASE_URL);
  const categoryLogic = new CategoryLogic(db);

  // データベースから取得
  const result = await categoryLogic.getCategories();

  return c.json(result);
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
    const values = c.req.valid("json");
    if (!values.name) {
      return c.json(
        { error: Messages.MSG_ERR_004(Property.CATEGORY_NAME) },
        400
      );
    }
    if (values.name.length > 100) {
      return c.json(
        {
          error: Messages.MSG_ERR_005(
            Property.CATEGORY_NAME,
            Length.CATEGORY_NAME
          ),
        },
        400
      );
    }

    // データベース接続
    const db = getDbConnection(c.env.DATABASE_URL);
    const categoryLogic = new CategoryLogic(db);

    // データベースへの登録
    const category = await categoryLogic.registerCategory(values);

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
    const values = c.req.valid("json");

    // バリデーションチェック
    if (!values.name) {
      return c.json(
        { error: Messages.MSG_ERR_004(Property.CATEGORY_NAME) },
        400
      );
    }
    if (values.name.length > 100) {
      return c.json(
        {
          error: Messages.MSG_ERR_005(
            Property.CATEGORY_NAME,
            Length.CATEGORY_NAME
          ),
        },
        400
      );
    }

    // データベース接続
    const db = getDbConnection(c.env.DATABASE_URL);
    const categoryLogic = new CategoryLogic(db);

    // カテゴリーの存在チェック
    const existsCategory = await categoryLogic.checkCategoryExists(categoryId);
    if (!existsCategory) {
      return c.json({ error: Messages.MSG_ERR_003(Entity.CATEGORY) }, 404);
    }

    // データベースへの更新
    const category = await categoryLogic.updateCategory(categoryId, values);

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
