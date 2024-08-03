import { getAuth } from "@hono/clerk-auth";
import { Context, Next } from "hono";
import { Messages } from "../sharedInfo/message";

export const validateAdmin = async (c: Context, next: Next) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: Messages.MSG_ERR_001 }, 401);
  }
  const isAdmin = auth.userId === c.env.ADMIN_USER_ID;
  if (!isAdmin) {
    return c.json({ error: Messages.MSG_ERR_002 }, 401);
  }
  c.set("userId", auth.userId);
  await next();
};
