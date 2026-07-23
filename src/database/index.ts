import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const getDbUrl = () => {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_DATABASE_URL) {
    return import.meta.env.VITE_DATABASE_URL;
  }
  if (typeof process !== "undefined" && process.env?.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  return "postgresql://neondb_owner:npg_RNbViKt4d5SU@ep-rough-snow-aia4ablg-pooler.c-4.us-east-1.aws.neon.tech/zen_sudoku?sslmode=require";
};

const databaseUrl = getDbUrl();
const sql = neon(databaseUrl);

export const db = drizzle(sql, { schema });
export * from "./schema";
