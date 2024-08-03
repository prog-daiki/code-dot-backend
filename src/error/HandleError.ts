import { Context } from "hono";

// 共通のエラーハンドリング関数
export const HandleError = (c: Context, error: unknown, message: string) => {
  console.error(`${message}:`, error);
  return c.json({ error: "予期せぬエラーが発生しました" }, 500);
};
