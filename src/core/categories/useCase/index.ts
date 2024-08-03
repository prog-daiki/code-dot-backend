import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../../db/schema";
import { CategoryRepository } from "../repository";
import { CategoryNotFoundError } from "../../../error/CategoryNotFoundError";

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

  /**
   * カテゴリーを登録する
   * @param name カテゴリー名
   * @returns 登録したカテゴリー
   */
  async registerCategory(name: string) {
    const categoryRepository = new CategoryRepository(this.db);
    const category = await categoryRepository.registerCategory({ name });
    return category;
  }

  /**
   * カテゴリーを更新する
   * @param categoryId カテゴリーID
   * @param name カテゴリー名
   * @returns 更新したカテゴリー
   */
  async updateCategory(categoryId: string, name: string) {
    const categoryRepository = new CategoryRepository(this.db);
    const existsCategory = await categoryRepository.checkCategoryExists(
      categoryId
    );
    if (!existsCategory) {
      throw new CategoryNotFoundError();
    }
    const category = await categoryRepository.updateCategory(categoryId, {
      name,
    });
    return category;
  }

  /**
   * カテゴリーを削除する
   * @param categoryId カテゴリーID
   * @returns 削除したカテゴリー
   */
  async deleteCategory(categoryId: string) {
    const categoryRepository = new CategoryRepository(this.db);
    const existsCategory = await categoryRepository.checkCategoryExists(
      categoryId
    );
    if (!existsCategory) {
      throw new CategoryNotFoundError();
    }
    const category = await categoryRepository.deleteCategory(categoryId);
    return category;
  }
}
