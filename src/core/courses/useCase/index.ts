import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../../db/schema";
import { CourseRepository } from "../repository";
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
   * 講座のサムネイルを更新する
   * @param courseId 講座ID
   * @param imageUrl サムネイルURL
   * @returns 講座
   */
  async updateCourseThumbnail(courseId: string, imageUrl: string) {
    const courseRepository = new CourseRepository(this.db);
    const existsCourse = await courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }
    const course = await courseRepository.updateCourse(courseId, { imageUrl });
    return course;
  }

  /**
   * 講座の価格を更新する
   * @param courseId 講座ID
   * @param price 価格
   * @returns 講座
   */
  async updateCoursePrice(courseId: string, price: number) {
    const courseRepository = new CourseRepository(this.db);
    const existsCourse = await courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }
    const course = await courseRepository.updateCourse(courseId, { price });
    return course;
  }

  /**
   * 講座のカテゴリーを更新する
   * @param courseId 講座ID
   * @param categoryId カテゴリーID
   * @returns 講座
   */
  async updateCourseCategory(courseId: string, categoryId: string) {
    const courseRepository = new CourseRepository(this.db);
    const categoryLogic = new CategoryLogic(this.db);
    const existsCourse = await courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }
    const existsCategory = await categoryLogic.checkCategoryExists(categoryId);
    if (!existsCategory) {
      throw new CategoryNotFoundError();
    }
    const course = await courseRepository.updateCourse(courseId, {
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
    const courseRepository = new CourseRepository(this.db);
    const existsCourse = await courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }
    const course = await courseRepository.updateCourse(courseId, {
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
    const courseRepository = new CourseRepository(this.db);
    const existsCourse = await courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }
    const course = await courseRepository.updateCourse(courseId, {
      publishFlag: false,
    });
    return course;
  }
}
