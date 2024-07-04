import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { category, insertCategorySchema } from "../../db/schema";
import { getAuth } from "@hono/clerk-auth";
import { Messages } from "../sharedInfo/message";
import { Env } from "..";
import { getDbConnection } from "../../db/drizzle";
import { getJstDate } from "../sharedInfo/date";
import { createId } from "@paralleldrive/cuid2";
import { CategoryLogic } from "./logic";

const Category = new Hono<{ Bindings: Env }>();

/**
 * カテゴリー一覧取得API
 */
Category.get("/", async (c) => {
  // 認証チェック
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: Messages.ERR_UNAUTHORIZED }, 401);
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
      return c.json({ error: Messages.ERR_UNAUTHORIZED }, 401);
    }
    if (auth.userId !== c.env.ADMIN_USER_ID) {
      return c.json({ error: Messages.MSG_ERR_ADMIN_UNAUTHORIZED }, 401);
    }

    // バリデーションチェック
    const values = c.req.valid("json");
    if (!values.name) {
      return c.json({ error: Messages.MSG_ERR_CATEGORY_REQUIRED }, 400);
    }
    if (values.name.length >= 100) {
      return c.json({ error: Messages.MSG_ERR_CATEGORY_LIMIT }, 400);
    }

    // データベース接続
    const db = getDbConnection(c.env.DATABASE_URL);

    // データベースへの登録
    const currentJstDate = getJstDate();
    const [data] = await db
      .insert(category)
      .values({
        id: createId(),
        name: values.name,
      })
      .returning();

    return c.json({ data });
  }
);

export default Category;
