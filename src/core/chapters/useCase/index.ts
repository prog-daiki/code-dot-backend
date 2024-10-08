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
  private muxDataRepository: MuxDataRepository;

  constructor(private db: PostgresJsDatabase<typeof schema>) {
    this.chapterRepository = new ChapterRepository(this.db);
    this.courseRepository = new CourseRepository(this.db);
    this.muxDataRepository = new MuxDataRepository(this.db);
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

    const chapter = await this.chapterRepository.updateChapter(chapterId, { title });
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

    const chapter = await this.chapterRepository.updateChapter(chapterId, { description });
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

    const { video } = new Mux({
      tokenId: c.env.MUX_TOKEN_ID!,
      tokenSecret: c.env.MUX_TOKEN_SECRET!,
    });

    // MuxDataの存在チェック
    const existsMuxData = await this.muxDataRepository.checkMuxDataExists(chapterId);
    if (existsMuxData) {
      await video.assets.delete(existsMuxData.assetId);
      await this.muxDataRepository.deleteMuxData(chapterId);
    }

    // MuxDataを登録する
    const asset = await video.assets.create({
      input: videoUrl as any,
      playback_policy: ["public"],
      test: false,
    });
    await this.muxDataRepository.registerMuxData(chapterId, asset.id, asset.playback_ids![0].id);

    // チャプターの動画を更新する
    const chapter = await this.chapterRepository.updateChapter(chapterId, {
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

    const { video } = new Mux({
      tokenId: c.env.MUX_TOKEN_ID!,
      tokenSecret: c.env.MUX_TOKEN_SECRET!,
    });

    // MuxDataの存在チェック
    const existsMuxData = await this.muxDataRepository.checkMuxDataExists(chapterId);
    if (existsMuxData) {
      await video.assets.delete(existsMuxData.assetId);
      await this.muxDataRepository.deleteMuxData(chapterId);
    }
    const chapter = await this.chapterRepository.deleteChapter(chapterId);

    // 講座のチャプターが0件になった場合、講座を非公開にする
    const chapters = await this.chapterRepository.getPublishChapters(courseId);
    if (chapters.length === 0) {
      await this.courseRepository.updateCourse(courseId, {
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

    const chapter = await this.chapterRepository.updateChapter(chapterId, {
      publishFlag: false,
    });

    // 講座のチャプターが0件になった場合、講座を非公開にする
    const chapters = await this.chapterRepository.getPublishChapters(courseId);
    if (chapters.length === 0) {
      await this.courseRepository.updateCourse(courseId, {
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

    // MuxDataの存在チェック
    const existsMuxData = await this.muxDataRepository.checkMuxDataExists(chapterId);
    if (!existsMuxData) {
      throw new MuxDataNotFoundError();
    }

    const data = await this.chapterRepository.getChapter(chapterId);
    if (!data.chapter.title || !data.chapter.description || !data.chapter.videoUrl) {
      throw new ChapterRequiredFieldsEmptyError();
    }

    const chapter = await this.chapterRepository.updateChapter(chapterId, {
      publishFlag: true,
    });
    return chapter;
  }
}
