import { Hono } from "hono";
import Course from "./core/courses";
import { cors } from "hono/cors";
import { clerkMiddleware } from "@hono/clerk-auth";
import Category from "./core/categories";
import Chapter from "./core/chapters";
import Webhook from "./core/webhook";
import { csrf } from "hono/csrf";

export type Env = {
  DATABASE_URL: string;
  ADMIN_USER_ID: string;
  MUX_TOKEN_ID: string;
  MUX_TOKEN_SECRET: string;
  STRIPE_API_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// CSRF対策を追加
app.use(
  "/api/*",
  csrf({
    origin: "http://localhost:3000",
  }),
);

app.use("*", clerkMiddleware());

const routes = app
  .route("/api/courses", Course)
  .route("/api/categories", Category)
  .route("/api/courses/:course_id/chapters", Chapter)
  .route("/webhook", Webhook);

export default app;
