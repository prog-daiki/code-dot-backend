import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../../db/schema";
import { ChapterRepository } from "../repository";
import { CourseRepository } from "../../courses/repository";
import { CourseNotFoundError } from "../../../error/CourseNotFoundError";
import { ChapterNotFoundError } from "../../../error/ChapterNotFoundError";
import { Context } from "hono";
import Mux from "@mux/mux-node";
import { MuxDataRepository } from "../../muxData/repository";
import { MuxDataNotFoundError } from "../../../error/MuxDataNotFoundError";
import { ChapterRequiredFieldsEmptyError } from "../../../error/ChapterRequiredFieldsEmptyError";

/**
 * チャプターのuseCaseを管理するクラス
 */
export class ChapterUseCase {
  private chapterRepository: ChapterRepository;
  private courseRepository: CourseRepository;

  constructor(private db: PostgresJsDatabase<typeof schema>) {
    this.chapterRepository = new ChapterRepository(this.db);
    this.courseRepository = new CourseRepository(this.db);
  }

  /**
   * 講座のチャプターを一覧取得する
   * @param courseId
   * @returns
   */
  async getChapters(courseId: string) {
    // 講座の存在チェック
    const existsCourse = await this.courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }

    const chapters = await this.chapterRepository.getChapters(courseId);
    return chapters;
  }

  /**
   * 講座のチャプターを取得する
   * @param courseId
   * @param chapterId
   * @returns
   */
  async getChapter(courseId: string, chapterId: string) {
    // 講座の存在チェック
    const existsCourse = await this.courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }

    // チャプターの存在チェック
    const existsChapter = await this.chapterRepository.checkChapterExists(chapterId);
    if (!existsChapter) {
      throw new ChapterNotFoundError();
    }

    const chapter = await this.chapterRepository.getChapter(chapterId);
    return chapter;
  }

  /**
   * 講座のチャプターを登録する
   * @param title
   * @param courseId
   * @returns
   */
  async registerChapter(title: string, courseId: string) {
    // 講座の存在チェック
    const existsCourse = await this.courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }

    const chapter = await this.chapterRepository.registerChapter({ title }, courseId);
    return chapter;
  }

  /**
   * 講座のチャプターを並び替える
   * @param courseId
   * @param list
   */
  async reorderChapters(courseId: string, list: { id: string; position: number }[]) {
    // 講座の存在チェック
    const existsCourse = await this.courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }

    await Promise.all(
      list.map(async (chapter) => {
        await this.chapterRepository.updateChapter(chapter.id, {
          position: chapter.position,
        });
      }),
    );
  }

  /**
   * 講座のチャプターのタイトルを更新する
   * @param chapterId
   * @param title
   * @param courseId
   * @returns
   */
  async updateChapterTitle(title: string, courseId: string, chapterId: string) {
    const chapterRepository = new ChapterRepository(this.db);
    const courseRepository = new CourseRepository(this.db);
    const existsCourse = await courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }
    const existsChapter = await chapterRepository.checkChapterExists(chapterId);
    if (!existsChapter) {
      throw new ChapterNotFoundError();
    }
    const chapter = await chapterRepository.updateChapter(chapterId, {
      title,
    });
    return chapter;
  }

  /**
   * 講座のチャプターの詳細を更新する
   * @param chapterId
   * @param description
   * @param courseId
   * @returns
   */
  async updateChapterDescription(description: string, courseId: string, chapterId: string) {
    const chapterRepository = new ChapterRepository(this.db);
    const courseRepository = new CourseRepository(this.db);
    const existsCourse = await courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }
    const existsChapter = await chapterRepository.checkChapterExists(chapterId);
    if (!existsChapter) {
      throw new ChapterNotFoundError();
    }
    const chapter = await chapterRepository.updateChapter(chapterId, {
      description,
    });
    return chapter;
  }

  /**
   * 講座のチャプターのアクセス権を更新する
   * @param chapterId
   * @param freeFlag
   * @param courseId
   * @returns
   */
  async updateChapterAccess(freeFlag: boolean, courseId: string, chapterId: string) {
    const chapterRepository = new ChapterRepository(this.db);
    const courseRepository = new CourseRepository(this.db);
    const existsCourse = await courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }
    const existsChapter = await chapterRepository.checkChapterExists(chapterId);
    if (!existsChapter) {
      throw new ChapterNotFoundError();
    }
    const chapter = await chapterRepository.updateChapter(chapterId, {
      freeFlag,
    });
    return chapter;
  }

  /**
   * 講座のチャプターの動画を更新する
   * @param videoUrl
   * @param courseId
   * @param chapterId
   * @param c
   * @returns
   */
  async updateChapterVideo(videoUrl: string, courseId: string, chapterId: string, c: Context) {
    const chapterRepository = new ChapterRepository(this.db);
    const courseRepository = new CourseRepository(this.db);
    const muxDataRepository = new MuxDataRepository(this.db);

    const existsCourse = await courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }
    const existsChapter = await chapterRepository.checkChapterExists(chapterId);
    if (!existsChapter) {
      throw new ChapterNotFoundError();
    }

    const { video } = new Mux({
      tokenId: c.env.MUX_TOKEN_ID!,
      tokenSecret: c.env.MUX_TOKEN_SECRET!,
    });
    const existsMuxData = await muxDataRepository.checkMuxDataExists(chapterId);
    if (existsMuxData) {
      await video.assets.delete(existsMuxData.assetId);
      await muxDataRepository.deleteMuxData(chapterId);
    }
    const asset = await video.assets.create({
      input: videoUrl as any,
      playback_policy: ["public"],
      test: false,
    });
    await muxDataRepository.registerMuxData(chapterId, asset.id, asset.playback_ids![0].id);
    const chapter = await chapterRepository.updateChapter(chapterId, {
      videoUrl,
    });
    return chapter;
  }

  /**
   * 講座のチャプターを削除する
   * @param courseId
   * @param chapterId
   */
  async deleteChapter(courseId: string, chapterId: string, c: Context) {
    const chapterRepository = new ChapterRepository(this.db);
    const courseRepository = new CourseRepository(this.db);
    const muxDataRepository = new MuxDataRepository(this.db);

    const existsCourse = await courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }
    const existsChapter = await chapterRepository.checkChapterExists(chapterId);
    if (!existsChapter) {
      throw new ChapterNotFoundError();
    }

    const { video } = new Mux({
      tokenId: c.env.MUX_TOKEN_ID!,
      tokenSecret: c.env.MUX_TOKEN_SECRET!,
    });
    const existsMuxData = await muxDataRepository.checkMuxDataExists(chapterId);
    if (existsMuxData) {
      await video.assets.delete(existsMuxData.assetId);
      await muxDataRepository.deleteMuxData(chapterId);
    }
    const chapter = await chapterRepository.deleteChapter(chapterId);

    const chapters = await chapterRepository.getPublishChapters(courseId);
    if (chapters.length === 0) {
      await courseRepository.updateCourse(courseId, {
        publishFlag: false,
      });
    }
    return chapter;
  }

  /**
   * 講座のチャプターを非公開にする
   * @param courseId
   * @param chapterId
   */
  async unpublishChapter(courseId: string, chapterId: string) {
    const chapterRepository = new ChapterRepository(this.db);
    const courseRepository = new CourseRepository(this.db);
    const existsCourse = await courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }
    const existsChapter = await chapterRepository.checkChapterExists(chapterId);
    if (!existsChapter) {
      throw new ChapterNotFoundError();
    }
    const chapter = await chapterRepository.updateChapter(chapterId, {
      publishFlag: false,
    });
    const chapters = await chapterRepository.getPublishChapters(courseId);
    if (chapters.length === 0) {
      await courseRepository.updateCourse(courseId, {
        publishFlag: false,
      });
    }
    return chapter;
  }

  /**
   * 講座のチャプターを公開する
   * @param courseId
   * @param chapterId
   */
  async publishChapter(courseId: string, chapterId: string) {
    const chapterRepository = new ChapterRepository(this.db);
    const courseRepository = new CourseRepository(this.db);
    const muxDataRepository = new MuxDataRepository(this.db);

    const existsCourse = await courseRepository.checkCourseExists(courseId);
    if (!existsCourse) {
      throw new CourseNotFoundError();
    }
    const existsChapter = await chapterRepository.checkChapterExists(chapterId);
    if (!existsChapter) {
      throw new ChapterNotFoundError();
    }
    const existsMuxData = await muxDataRepository.checkMuxDataExists(chapterId);
    if (!existsMuxData) {
      throw new MuxDataNotFoundError();
    }
    const data = await chapterRepository.getChapter(chapterId);
    if (!data.chapter.title || !data.chapter.description || !data.chapter.videoUrl) {
      throw new ChapterRequiredFieldsEmptyError();
    }

    const chapter = await chapterRepository.updateChapter(chapterId, {
      publishFlag: true,
    });
    return chapter;
  }
}
