import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { insertCategorySchema } from "../../db/schema";
import { getAuth } from "@hono/clerk-auth";
import { Length, Messages, Property } from "../sharedInfo/message";
import { Env } from "..";
import { getDbConnection } from "../../db/drizzle";
import { CategoryLogic } from "./logic";

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
    if (auth.userId !== c.env.ADMIN_USER_ID) {
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

export default Category;
