import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../../db/schema";
import { CourseLogic } from "../logic";
import { Context } from "hono";
import { CourseNotFoundError } from "../../../error/CourseNotFoundError";

/**
 * 講座のuseCaseを管理するクラス
 */
export class CourseUseCase {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

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
