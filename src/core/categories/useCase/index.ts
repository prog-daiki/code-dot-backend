import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../../db/schema";
import { CategoryRepository } from "../repository";
import { CategoryNotFoundError } from "../../../error/CategoryNotFoundError";

/**
 * カテゴリーのuseCaseを管理するクラス
 */
export class CategoryUseCase {
  private categoryRepository: CategoryRepository;
  constructor(private db: PostgresJsDatabase<typeof schema>) {
    this.categoryRepository = new CategoryRepository(this.db);
  }

  /**
   * カテゴリー一覧を取得する
   * @returns カテゴリー一覧
   */
  async getCategories() {
    const categories = await this.categoryRepository.getCategories();
    return categories;
  }

  /**
   * カテゴリーを登録する
   * @param name カテゴリー名
   * @returns 登録したカテゴリー
   */
  async registerCategory(name: string) {
    const category = await this.categoryRepository.registerCategory({ name });
    return category;
  }

  /**
   * カテゴリーを更新する
   * @param categoryId カテゴリーID
   * @param name カテゴリー名
   * @returns 更新したカテゴリー
   */
  async updateCategory(categoryId: string, name: string) {
    // カテゴリーの存在チェック
    const existsCategory = await this.categoryRepository.checkCategoryExists(categoryId);
    if (!existsCategory) {
      throw new CategoryNotFoundError();
    }

    const category = await this.categoryRepository.updateCategory(categoryId, { name });
    return category;
  }

  /**
   * カテゴリーを削除する
   * @param categoryId カテゴリーID
   * @returns 削除したカテゴリー
   */
  async deleteCategory(categoryId: string) {
    // カテゴリーの存在チェック
    const existsCategory = await this.categoryRepository.checkCategoryExists(categoryId);
    if (!existsCategory) {
      throw new CategoryNotFoundError();
    }

    const category = await this.categoryRepository.deleteCategory(categoryId);
    return category;
  }
}
