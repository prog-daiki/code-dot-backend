import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import { getDbConnection } from "../../db/drizzle";
import { courses } from "../../db/schema";
import { Env } from "..";
import { and, eq } from "drizzle-orm";
import { Messages } from "../sharedInfo/message";

const Course = new Hono<{ Bindings: Env }>();

/**
 * 講座一覧取得API
 */
Course.get("/", clerkMiddleware(), async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: Messages.ERR_UNAUTHORIZED }, 401);
  }

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
Course.get("/:id", clerkMiddleware(), async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: Messages.ERR_UNAUTHORIZED }, 401);
  }

  const id = c.req.param("id");

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

  if (!result) {
    return c.json({ error: Messages.ERR_COURSE_NOT_FOUND }, 404);
  }

  return c.json({ result });
});

export default Course;
