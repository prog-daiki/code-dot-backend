import { Hono } from "hono";
import Course from "./courses";

export type Env = {
  DATABASE_URL: string;
};

const app = new Hono<{ Bindings: Env }>().basePath("/api");

const routes = app.route("/courses", Course);

export default app;
