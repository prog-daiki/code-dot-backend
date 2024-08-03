import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { chapter, muxData } from "../../../../db/schema";
import * as schema from "../../../../db/schema";
import { getJstDate } from "../../../sharedInfo/date";
import { createId } from "@paralleldrive/cuid2";
import { and, asc, eq } from "drizzle-orm";

export class ChapterRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  /**
   * チャプターの存在チェック
   * @param chapterId
   * @returns
   */
  async checkChapterExists(chapterId: string) {
    const [existChapter] = await this.db
      .select()
      .from(chapter)
      .where(eq(chapter.id, chapterId));
    return !!existChapter;
  }

  /**
   * チャプターを登録する
   * @param values
   */
  async registerChapter(
    values: Pick<typeof chapter.$inferInsert, "title">,
    courseId: string
  ) {
    const currentJstDate = getJstDate();
    const chapters = await this.getChapters(courseId);
    const lastChapter = chapters[chapters.length - 1];
    const [data] = await this.db
      .insert(chapter)
      .values({
        id: createId(),
        ...values,
        courseId,
        position: lastChapter ? lastChapter.position + 1 : 1,
        createDate: currentJstDate,
        updateDate: currentJstDate,
      })
      .returning();
    return data;
  }

  /**
   * 講座に紐づくチャプターを一覧取得する
   * @param courseId
   * @returns
   */
  async getChapters(courseId: string) {
    const chapters = await this.db
      .select()
      .from(chapter)
      .where(eq(chapter.courseId, courseId))
      .orderBy(asc(chapter.position));
    return chapters;
  }

  /**
   * 講座に紐づくチャプター(公開済み)を一覧取得する
   * @param courseId
   * @returns
   */
  async getPublishChapters(courseId: string) {
    const chapters = await this.db
      .select()
      .from(chapter)
      .where(and(eq(chapter.courseId, courseId), eq(chapter.publishFlag, true)))
      .orderBy(asc(chapter.position));
    return chapters;
  }

  /**
   * チャプター取得する
   * @param chapterId
   * @returns
   */
  async getChapter(chapterId: string) {
    const [data] = await this.db
      .select()
      .from(chapter)
      .leftJoin(muxData, eq(chapter.id, muxData.chapterId))
      .where(eq(chapter.id, chapterId));
    return data;
  }

  /**
   * チャプターを更新する
   * @param id
   * @param updateData
   * @returns
   */
  async updateChapter(
    id: string,
    updateData: Partial<Omit<typeof chapter.$inferInsert, "id" | "createDate">>
  ) {
    const currentJsDate = getJstDate();
    const [data] = await this.db
      .update(chapter)
      .set({ ...updateData, updateDate: currentJsDate })
      .where(eq(chapter.id, id))
      .returning();
    return data;
  }

  /**
   * チャプターを削除する
   * @param chapterId
   */
  async deleteChapter(chapterId: string) {
    const [data] = await this.db
      .delete(chapter)
      .where(eq(chapter.id, chapterId))
      .returning();
    return data;
  }
}
