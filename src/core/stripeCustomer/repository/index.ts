import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../../db/schema";
import { stripeCustomer } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { getJstDate } from "../../../sharedInfo/date";

/**
 * Stripe顧客情報のリポジトリを管理するクラス
 */
export class StripeCustomerRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  /**
   * Stripe顧客情報を取得する
   * @param userId ユーザーID
   * @returns Stripe顧客情報
   */
  async getStripeCustomer(userId: string) {
    const [customer] = await this.db
      .select()
      .from(stripeCustomer)
      .where(eq(stripeCustomer.userId, userId));
    return customer;
  }

  async registerStripeCustomer(userId: string, stripeCustomerId: string) {
    const currentJstDate = getJstDate();
    const [data] = await this.db
      .insert(stripeCustomer)
      .values({
        id: createId(),
        createDate: currentJstDate,
        updateDate: currentJstDate,
        userId,
        stripeCustomerId,
      })
      .returning();
    return data;
  }
}
