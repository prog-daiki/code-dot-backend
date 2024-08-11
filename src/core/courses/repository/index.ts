import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../../db/schema";
import { course, chapter, category } from "../../../../db/schema";
import { desc, eq, and, sql, ilike } from "drizzle-orm";
import { getJstDate } from "../../../sharedInfo/date";
import { createId } from "@paralleldrive/cuid2";

/**
 * 講座のリポジトリを管理するクラス
 */
export class CourseRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  /**
   * 講座の存在チェック
   * @param courseId
   * @returns
   */
  async checkCourseExists(courseId: string) {
    const [existCourse] = await this.db
      .select()
      .from(course)
      .where(eq(course.id, courseId));
    return !!existCourse;
  }

  /**
   * 講座を取得する
   * @param courseId
   * @returns
   */
  async getCourse(courseId: string) {
    const [data] = await this.db
      .select()
      .from(course)
      .where(eq(course.id, courseId));
    return data;
  }

  /**
   * 講座を一覧取得する
   * @returns
   */
  async getCourses() {
    const data = await this.db
      .select()
      .from(course)
      .orderBy(desc(course.updateDate));
    return data;
  }

  /**
   * 公開講座を一覧取得する
   * @param title
   * @param categoryId
   * @returns
   */
  async getPublishCourses(title?: string, categoryId?: string) {
    const data = await this.db
      .select({
        course,
        category,
        chapters: sql<
          (typeof chapter)[]
        >`coalesce(json_agg(${chapter}) filter (where ${chapter.id} is not null), '[]')`.as(
          "chapters"
        ),
      })
      .from(course)
      .leftJoin(chapter, eq(course.id, chapter.courseId))
      .leftJoin(category, eq(course.categoryId, category.id))
      .where(
        and(
          eq(course.publishFlag, true),
          eq(chapter.publishFlag, true),
          title ? ilike(course.title, `%${title}%`) : undefined,
          categoryId ? eq(course.categoryId, categoryId) : undefined
        )
      )
      .groupBy(course.id, category.id)
      .orderBy(desc(course.updateDate));
    return data;
  }

  /**
   * 講座を登録する
   * @param values
   * @param userId
   * @returns
   */
  async registerCourse(
    values: Pick<typeof course.$inferInsert, "title">,
    userId: string
  ) {
    const currentJstDate = getJstDate();
    const [data] = await this.db
      .insert(course)
      .values({
        id: createId(),
        ...values,
        createDate: currentJstDate,
        updateDate: currentJstDate,
        userId,
      })
      .returning();
    return data;
  }

  /**
   * 講座を更新する
   * @param db
   * @param courseId
   * @param value
   * @returns
   */
  async updateCourse(
    courseId: string,
    updateData: Partial<Omit<typeof course.$inferInsert, "id" | "createDate">>
  ) {
    const currentJstDate = getJstDate();
    const [data] = await this.db
      .update(course)
      .set({
        ...updateData,
        updateDate: currentJstDate,
      })
      .where(eq(course.id, courseId))
      .returning();

    return data;
  }

  /**
   * 講座を物理削除する
   * @param courseId
   * @returns
   */
  async deleteCourse(courseId: string) {
    const [data] = await this.db
      .delete(course)
      .where(eq(course.id, courseId))
      .returning();
    return data;
  }
}
