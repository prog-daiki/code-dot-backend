import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import CourseController from "./controller/CourseController";
import { clerkMiddleware } from "@hono/clerk-auth";

const app = new Hono().basePath("/api");
app.use("*", clerkMiddleware());

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  return c.json({ error: "Internal Server Error" }, 500);
});

const routes = app.route("/courses", CourseController);

export default app;
