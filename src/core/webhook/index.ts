import { Hono } from "hono";
import { Env } from "../..";
import Stripe from "stripe";
import { stripe } from "../../lib/stripe";
import { getDbConnection } from "../../../db/drizzle";
import { purchase } from "../../../db/schema";
import { createId } from "@paralleldrive/cuid2";
import { getJstDate } from "../../sharedInfo/date";

const Webhook = new Hono<{ Bindings: Env }>();

Webhook.post("/", async (c) => {
  const body = await c.req.text();
  const signature = c.req.header("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = await stripe(c).webhooks.constructEventAsync(
      body,
      signature,
      c.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error: any) {
    console.error("Webhookエラー:", error.message);
    return c.json({ error: `Webhook Error: ${error.message}` }, 400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(c, event);
        break;
      // 他のイベントタイプも必要に応じて追加
      default:
        console.log(`未処理のイベントタイプ: ${event.type}`);
    }

    return c.json({ received: true }, 200);
  } catch (error: any) {
    console.error("イベント処理エラー:", error.message);
    return c.json({ error: `Event processing error: ${error.message}` }, 500);
  }
});

async function handleCheckoutSessionCompleted(c: any, event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.userId;
  const courseId = session.metadata?.courseId;

  if (!userId || !courseId) {
    throw new Error("Missing metadata");
  }

  const db = getDbConnection(c.env.DATABASE_URL);
  const currentJstDate = getJstDate();

  await db.insert(purchase).values({
    id: createId(),
    createDate: currentJstDate,
    updateDate: currentJstDate,
    courseId,
    userId,
  });

  console.log(`購入完了: ユーザーID ${userId}, コースID ${courseId}`);
}

export default Webhook;
