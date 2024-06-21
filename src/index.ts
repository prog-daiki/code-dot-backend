import { Hono } from "hono";
import CourseController from "./courses";

export type Env = {
  DATABASE_URL: string;
};

const app = new Hono<{ Bindings: Env }>().basePath("/api");

const routes = app.route("/courses", CourseController);

export default app;
