import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import * as dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL environment variable is missing in .env!");
  process.exit(1);
}

async function runMigrations() {
  console.log("🚀 Running database migrations on Neon PostgreSQL...");
  const sql = neon(databaseUrl!);
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("✅ Database migrations applied successfully!");
}

runMigrations().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
