import { Hono } from "hono";
import CourseController from "./controller/CourseController";
import { clerkMiddleware } from "@hono/clerk-auth";

const app = new Hono().basePath("/api");
app.use("*", clerkMiddleware());

const routes = app.route("/courses", CourseController);

export default app;
