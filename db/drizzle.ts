import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export const getDbConnection = (databaseUrl: string) => {
  const sql = postgres(databaseUrl);
  return drizzle(sql, { schema });
};
