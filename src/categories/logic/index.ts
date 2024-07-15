import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../db/schema";
import { asc, eq } from "drizzle-orm";
import { category } from "../../../db/schema";
/**
 * カテゴリーのロジックを管理するクラス
 */
export class CategoryLogic {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  /**
   * カテゴリーを一覧取得する
   * @returns
   */
  async getCategories() {
    const data = await this.db
      .select()
      .from(category)
      .orderBy(asc(category.name));
    return data;
  }

  /**
   * カテゴリーが存在するかをチェックする
   * @param categoryId
   * @returns
   */
  async checkCategoryExists(categoryId: string) {
    const [existCategory] = await this.db
      .select()
      .from(category)
      .where(eq(category.id, categoryId));
    return !!existCategory;
  }
}
