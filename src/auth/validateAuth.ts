import { getAuth } from "@hono/clerk-auth";
import { Context, Next } from "hono";
import { Messages } from "../sharedInfo/message";

export const validateAuth = async (c: Context, next: Next) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: Messages.MSG_ERR_001 }, 401);
  }
  c.set("userId", auth.userId);
  await next();
};
