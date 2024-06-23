import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import { getDbConnection } from "../../db/drizzle";
import { courses } from "../../db/schema";
import { Env } from "..";
import { and, eq } from "drizzle-orm";
import { Messages } from "../sharedInfo/message";

const CourseController = new Hono<{ Bindings: Env }>();

/**
 * 講座一覧取得API
 */
CourseController.get("/", clerkMiddleware(), async (c) => {
  // ユーザーの認証チェック
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: Messages.ERR_UNAUTHORIZED }, 401);
  }

  // 講座の一覧を取得する
  const db = getDbConnection(c.env.DATABASE_URL);
  const result = await db
    .select()
    .from(courses)
    .where(and(eq(courses.deleteFlag, false), eq(courses.publishFlag, true)));

  return c.json({ result });
});

/**
 * 講座取得API
 */
CourseController.get("/:id", clerkMiddleware(), async (c) => {
  // ユーザーの認証チェック
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: Messages.ERR_UNAUTHORIZED }, 401);
  }

  // 講座のIDを取得する
  const id = c.req.param("id");

  // 講座の詳細を取得する
  const db = getDbConnection(c.env.DATABASE_URL);
  const result = await db
    .select()
    .from(courses)
    .where(
      and(
        eq(courses.id, id),
        eq(courses.deleteFlag, false),
        eq(courses.publishFlag, true)
      )
    );

  // 講座が見つからない場合は404を返す
  if (!result) {
    return c.json({ error: Messages.ERR_COURSE_NOT_FOUND }, 404);
  }

  return c.json({ result });
});

export default CourseController;
