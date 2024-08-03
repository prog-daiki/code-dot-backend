import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../../db/schema";
import { ChapterRepository } from "../repository";
import { CourseRepository } from "../../courses/repository";
import { CourseNotFoundError } from "../../../error/CourseNotFoundError";
import { ChapterNotFoundError } from "../../../error/ChapterNotFoundError";

/**
 * チャプターのuseCaseを管理するクラス
 */
export class ChapterUseCase {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  /**
   * 講座のチャプターを一覧取得する
   * @param courseId
   * @returns
   */
  async getChapters(courseId: string) {
    const chapterRepository = new ChapterRepository(this.db);
    const courseRepository = new CourseRepository(this.db);
    const existsCourse = await courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }
    const chapters = await chapterRepository.getChapters(courseId);
    return chapters;
  }

  /**
   * 講座のチャプターを取得する
   * @param courseId
   * @param chapterId
   * @returns
   */
  async getChapter(courseId: string, chapterId: string) {
    const chapterRepository = new ChapterRepository(this.db);
    const courseRepository = new CourseRepository(this.db);
    const existsCourse = await courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }
    const existsChapter = await chapterRepository.checkChapterExists(courseId);
    if (!existsChapter) {
      throw new ChapterNotFoundError();
    }
    const chapter = await chapterRepository.getChapter(chapterId);
    return chapter;
  }
}
