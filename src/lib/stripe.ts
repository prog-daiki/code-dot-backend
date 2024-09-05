import { Context } from "hono";
import Stripe from "stripe";

// export const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
//   apiVersion: "2024-06-20",
//   typescript: true,
// });

export const stripe = (c: Context): Stripe => {
  return new Stripe(c.env.STRIPE_API_KEY!, {
    apiVersion: "2024-06-20",
    typescript: true,
  });
};
