import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../../db/schema";
import { purchase } from "../../../../db/schema";
import { eq, and } from "drizzle-orm";

/**
 * 購入情報のリポジトリを管理するクラス
 */
export class PurchaseRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  /**
   * 購入情報が存在するかを確認する
   * @param courseId 講座ID
   * @param userId ユーザーID
   * @returns 購入情報が存在するか
   */
  async existsPurchase(courseId: string, userId: string) {
    const result = await this.db
      .select()
      .from(purchase)
      .where(and(eq(purchase.courseId, courseId), eq(purchase.userId, userId)))
      .limit(1);
    return result.length > 0;
  }
}
