import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../db/schema";
import { course } from "../../../db/schema";
import { and, eq } from "drizzle-orm";
import { getJstDate } from "../../sharedInfo/date";
import { createId } from "@paralleldrive/cuid2";

/**
 * 講座のロジックを管理するクラス
 */
export class CourseLogic {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  /**
   * 講座の存在チェック
   * @param db
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
      .where(
        and(
          eq(course.id, courseId),
          eq(course.deleteFlag, false),
          eq(course.publishFlag, true)
        )
      );
    return data;
  }

  /**
   * 講座を取得する（管理者）
   * @param courseId
   * @returns
   */
  async getCourseByAdmin(courseId: string) {
    const [data] = await this.db
      .select()
      .from(course)
      .where(eq(course.id, courseId));
    return data;
  }

  /**
   * 講座を一覧取得する (管理者)
   * @returns
   */
  async getCoursesByAdmin() {
    const data = await this.db.select().from(course);
    return data;
  }

  /**
   * 講座を一覧取得する (ユーザー)
   * @returns
   */
  async getCourses() {
    const data = await this.db
      .select()
      .from(course)
      .where(and(eq(course.deleteFlag, false), eq(course.publishFlag, true)));
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

    return { data };
  }
}
