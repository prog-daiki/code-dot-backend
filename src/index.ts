import { Hono } from "hono";
import Course from "./courses";
import { cors } from "hono/cors";
import { clerkMiddleware } from "@hono/clerk-auth";
import Category from "./categories";
import Chapter from "./chapters";

export type Env = {
  DATABASE_URL: string;
  ADMIN_USER_ID: string;
};

const app = new Hono<{ Bindings: Env }>().basePath("/api");

app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use("*", clerkMiddleware());

const routes = app
  .route("/courses", Course)
  .route("/categories", Category)
  .route("/courses/:course_id/chapters", Chapter);

export default app;
