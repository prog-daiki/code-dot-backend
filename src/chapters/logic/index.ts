import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { chapter } from "../../../db/schema";
import * as schema from "../../../db/schema";
import { getJstDate } from "../../sharedInfo/date";
import { createId } from "@paralleldrive/cuid2";
import { asc, eq } from "drizzle-orm";

export class ChapterLogic {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

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
   * 講座に紐づくチャプターを取得する
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
}
