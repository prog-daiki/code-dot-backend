import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../../db/schema";
import { CourseRepository } from "../repository";
import { Context } from "hono";
import { CourseNotFoundError } from "../../../error/CourseNotFoundError";

import { CategoryNotFoundError } from "../../../error/CategoryNotFoundError";
import { CategoryRepository } from "../../categories/repository";
import { ChapterRepository } from "../../chapters/repository";
import { CourseRequiredFieldsEmptyError } from "../../../error/CourseRequiredFieldsEmptyError";
import { MuxDataRepository } from "../../muxData/repository";
import Mux from "@mux/mux-node";

/**
 * 講座のuseCaseを管理するクラス
 */
export class CourseUseCase {
  private courseRepository: CourseRepository;

  constructor(private db: PostgresJsDatabase<typeof schema>) {
    this.courseRepository = new CourseRepository(this.db);
  }

  /**
   * 講座一覧を取得する
   * @returns 講座一覧
   */
  async getCourses() {
    const courses = await this.courseRepository.getCourses();
    return courses;
  }

  async getPublishCourses(title?: string, categoryId?: string) {
    const courses = await this.courseRepository.getPublishCourses(title, categoryId);
    return courses;
  }

  /**
   * 講座を取得する
   * @param courseId 講座ID
   * @returns 講座
   */
  async getCourse(courseId: string) {
    // 講座の存在チェック
    const existsCourse = await this.courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }

    // 講座取得
    const course = await this.courseRepository.getCourse(courseId);
    return course;
  }

  /**
   * 講座を登録する
   * @param title タイトル
   * @param userId ユーザーID
   * @returns 講座
   */
  async registerCourse(title: string, userId: string) {
    const course = await this.courseRepository.registerCourse({ title }, userId);
    return course;
  }

  /**
   * 講座のタイトルを更新する
   * @param courseId 講座ID
   * @param title タイトル
   * @returns 講座
   */
  async updateCourseTitle(courseId: string, title: string) {
    // 講座の存在チェック
    const existsCourse = await this.courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }

    const course = await this.courseRepository.updateCourse(courseId, { title });
    return course;
  }

  /**
   * 講座の詳細を更新する
   * @param courseId 講座ID
   * @param description 詳細
   * @returns 講座
   */
  async updateCourseDescription(courseId: string, description: string) {
    // 講座の存在チェック
    const existsCourse = await this.courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }

    const course = await this.courseRepository.updateCourse(courseId, { description });
    return course;
  }

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
    const categoryRepository = new CategoryRepository(this.db);
    const existsCourse = await courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }
    const existsCategory = await categoryRepository.checkCategoryExists(categoryId);
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

  /**
   * 講座を公開する
   * @param courseId 講座ID
   * @returns 講座
   */
  async publishCourse(courseId: string) {
    const courseRepository = new CourseRepository(this.db);
    const chapterRepository = new ChapterRepository(this.db);

    const existsCourse = await courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }

    const course = await courseRepository.getCourse(courseId);
    const publishChapters = await chapterRepository.getPublishChapters(courseId);
    if (
      publishChapters.length === 0 ||
      !course.title ||
      !course.description ||
      !course.imageUrl ||
      !course.categoryId ||
      course.price === null
    ) {
      throw new CourseRequiredFieldsEmptyError();
    }

    const updatedCourse = await courseRepository.updateCourse(courseId, {
      publishFlag: true,
    });
    return updatedCourse;
  }

  /**
   * 講座を物理削除する
   * @param courseId 講座ID
   * @param c コンテキスト
   */
  async hardDeleteCourse(courseId: string, c: Context) {
    const courseRepository = new CourseRepository(this.db);
    const muxRepository = new MuxDataRepository(this.db);
    const existsCourse = await courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }
    const { video } = new Mux({
      tokenId: c.env.MUX_TOKEN_ID!,
      tokenSecret: c.env.MUX_TOKEN_SECRET!,
    });
    const muxDataList = await muxRepository.getMuxDataByCourseId(courseId);
    if (muxDataList.length > 0) {
      for (const muxData of muxDataList) {
        await video.assets.delete(muxData.muxData.assetId);
      }
    }
    const course = await courseRepository.deleteCourse(courseId);
    return course;
  }
}
