import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";

const CourseController = new Hono();

CourseController.get("/", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({ message: "Hello, World!" });
});

export default CourseController;
