import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../../db/schema";
import { CategoryRepository } from "../repository";

/**
 * カテゴリーのuseCaseを管理するクラス
 */
export class CategoryUseCase {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  /**
   * カテゴリー一覧を取得する
   * @returns カテゴリー一覧
   */
  async getCategories() {
    const categoryRepository = new CategoryRepository(this.db);
    const categories = await categoryRepository.getCategories();
    return categories;
  }
}
