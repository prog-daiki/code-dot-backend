import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../../db/schema";
import { CourseLogic } from "../logic";
import { Context } from "hono";
import { CourseNotFoundError } from "../../../error/CourseNotFoundError";
import { CategoryLogic } from "../../categories/logic";
import { CategoryNotFoundError } from "../../../error/CategoryNotFoundError";

/**
 * 講座のuseCaseを管理するクラス
 */
export class CourseUseCase {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  /**
   * 講座の価格を更新する
   * @param courseId 講座ID
   * @param price 価格
   * @returns 講座
   */
  async updateCoursePrice(courseId: string, price: number) {
    const courseLogic = new CourseLogic(this.db);
    // 講座の存在チェック
    const existsCourse = await courseLogic.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }
    // データベースへの更新
    const course = await courseLogic.updateCourse(courseId, { price });
    return course;
  }

  /**
   * 講座のカテゴリーを更新する
   * @param courseId 講座ID
   * @param categoryId カテゴリーID
   * @returns 講座
   */
  async updateCourseCategory(courseId: string, categoryId: string) {
    const courseLogic = new CourseLogic(this.db);
    const categoryLogic = new CategoryLogic(this.db);
    // 講座の存在チェック
    const existsCourse = await courseLogic.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }
    // カテゴリーの存在チェック
    const existsCategory = await categoryLogic.checkCategoryExists(categoryId);
    if (!existsCategory) {
      throw new CategoryNotFoundError();
    }
    // データベースへの更新
    const course = await courseLogic.updateCourse(courseId, {
      categoryId,
    });
    return course;
  }

  /**
   * 講座を論理削除する
   * @param courseId 講座ID
   * @param c コンテキスト
   * @returns 講座
   */
  async softDeleteCourse(courseId: string, c: Context) {
    const courseLogic = new CourseLogic(this.db);
    // 講座の存在チェック
    const existsCourse = await courseLogic.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }
    // データベースへの更新
    const course = await courseLogic.updateCourse(courseId, {
      deleteFlag: true,
      publishFlag: false,
    });
    return course;
  }

  /**
   * 講座を非公開にする
   * @param courseId 講座ID
   * @param c コンテキスト
   * @returns 講座
   */
  async unpublishCourse(courseId: string, c: Context) {
    const courseLogic = new CourseLogic(this.db);
    // 講座の存在チェック
    const existsCourse = await courseLogic.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }
    // データベースへの更新
    const course = await courseLogic.updateCourse(courseId, {
      publishFlag: false,
    });
    return course;
  }
}
