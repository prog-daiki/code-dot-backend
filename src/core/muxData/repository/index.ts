import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../../db/schema";
import { muxData, chapter } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

/**
 * muxDataのリポジトリ
 */
export class MuxDataRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  /**
   * チャプターのmuxDataの存在チェック
   * @param chapterId
   * @returns
   */
  async checkMuxDataExists(chapterId: string) {
    const [existMuxData] = await this.db
      .select()
      .from(muxData)
      .where(eq(muxData.chapterId, chapterId));
    return existMuxData;
  }

  /**
   * muxDataを削除する
   * @param chapterId
   */
  async deleteMuxData(chapterId: string) {
    await this.db.delete(muxData).where(eq(muxData.chapterId, chapterId));
  }

  /**
   * muxDataを登録する
   * @param chapterId
   * @param assetId
   */
  async registerMuxData(
    chapterId: string,
    assetId: string,
    playbackId: string
  ) {
    await this.db.insert(muxData).values({
      id: createId(),
      chapterId,
      assetId,
      playbackId,
    });
  }

  /**
   * 講座IDからmuxDataを取得する
   * @param courseId
   * @returns
   */
  async getMuxDataByCourseId(courseId: string) {
    const data = await this.db
      .select({
        muxData,
      })
      .from(muxData)
      .innerJoin(chapter, eq(muxData.chapterId, chapter.id))
      .where(eq(chapter.courseId, courseId));
    return data;
  }
}
