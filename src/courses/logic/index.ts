import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../../db/schema";
import { course } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { getJstDate } from "../../sharedInfo/date";

/**
 * 講座の存在チェック
 * @param db
 * @param courseId
 * @returns
 */
export async function checkCourseExists(
  db: PostgresJsDatabase<typeof schema>,
  courseId: string
) {
  const [existCourse] = await db
    .select()
    .from(course)
    .where(eq(course.id, courseId));
  return !!existCourse;
}

/**
 * 講座を更新する
 * @param db
 * @param courseId
 * @param value
 * @returns
 */
export async function updateCourseDescription(
  db: PostgresJsDatabase<typeof schema>,
  courseId: string,
  updateData: Partial<Omit<typeof course.$inferInsert, "id" | "createDate">>
) {
  const currentJstDate = getJstDate();
  const [data] = await db
    .update(course)
    .set({
      ...updateData,
      updateDate: currentJstDate,
    })
    .where(eq(course.id, courseId))
    .returning();

  return { data };
}
