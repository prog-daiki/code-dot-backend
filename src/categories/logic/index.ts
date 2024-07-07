import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../db/schema";
import { asc } from "drizzle-orm";
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
      .from(schema.category)
      .orderBy(asc(schema.category.name));
    return data;
  }
}
