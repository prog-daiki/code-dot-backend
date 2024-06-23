import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import { getDbConnection } from "../../db/drizzle";
import { course } from "../../db/schema";
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
  const data = await db
    .select()
    .from(course)
    .where(and(eq(course.deleteFlag, false), eq(course.publishFlag, true)));

  return c.json({ data });
});

/**
 * 講座取得API
 */
Course.get("/:course_id", clerkMiddleware(), async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: Messages.ERR_UNAUTHORIZED }, 401);
  }

  const courseId = c.req.param("course_id");

  const db = getDbConnection(c.env.DATABASE_URL);
  const data = await db
    .select()
    .from(course)
    .where(
      and(
        eq(course.id, courseId),
        eq(course.deleteFlag, false),
        eq(course.publishFlag, true)
      )
    );

  if (!data) {
    return c.json({ error: Messages.ERR_COURSE_NOT_FOUND }, 404);
  }

  return c.json({ data });
});

export default Course;
