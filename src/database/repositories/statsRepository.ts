import { db } from "../index";
import { statistics } from "../schema";
import { eq, sql } from "drizzle-orm";

export async function getStatistics(userId: string) {
  try {
    const [stats] = await db
      .select()
      .from(statistics)
      .where(eq(statistics.userId, userId))
      .limit(1);
    return stats || null;
  } catch (error) {
    console.error("Database Error [getStatistics]:", error);
    return null;
  }
}

export interface UpdateStatsData {
  gamesPlayed?: number;
  gamesWon?: number;
  bestEasy?: number | null;
  bestMedium?: number | null;
  bestHard?: number | null;
  bestExpert?: number | null;
  currentStreak?: number;
  longestStreak?: number;
  averageTime?: number;
  completedLevels?: string[];
}

export async function updateStatistics(userId: string, data: UpdateStatsData) {
  try {
    // Build the values to insert/update — always provide safe defaults
    const completedLevels = Array.isArray(data.completedLevels)
      ? data.completedLevels
      : [];

    const values = {
      userId,
      gamesPlayed: data.gamesPlayed ?? 0,
      gamesWon: data.gamesWon ?? 0,
      bestEasy: data.bestEasy ?? null,
      bestMedium: data.bestMedium ?? null,
      bestHard: data.bestHard ?? null,
      bestExpert: data.bestExpert ?? null,
      currentStreak: data.currentStreak ?? 0,
      longestStreak: data.longestStreak ?? 0,
      averageTime: data.averageTime ?? 0,
      completedLevels,
      updatedAt: new Date(),
    };

    // Use upsert: insert or update in one atomic operation.
    // On conflict (userId already exists), update all fields.
    const [result] = await db
      .insert(statistics)
      .values(values)
      .onConflictDoUpdate({
        target: statistics.userId,
        set: {
          gamesPlayed: sql`GREATEST(statistics.games_played, EXCLUDED.games_played)`,
          gamesWon: sql`GREATEST(statistics.games_won, EXCLUDED.games_won)`,
          // For best times: keep the LOWER value (faster time is better). Use LEAST but handle nulls.
          bestEasy: sql`
            CASE
              WHEN statistics.best_easy IS NULL THEN EXCLUDED.best_easy
              WHEN EXCLUDED.best_easy IS NULL THEN statistics.best_easy
              ELSE LEAST(statistics.best_easy, EXCLUDED.best_easy)
            END`,
          bestMedium: sql`
            CASE
              WHEN statistics.best_medium IS NULL THEN EXCLUDED.best_medium
              WHEN EXCLUDED.best_medium IS NULL THEN statistics.best_medium
              ELSE LEAST(statistics.best_medium, EXCLUDED.best_medium)
            END`,
          bestHard: sql`
            CASE
              WHEN statistics.best_hard IS NULL THEN EXCLUDED.best_hard
              WHEN EXCLUDED.best_hard IS NULL THEN statistics.best_hard
              ELSE LEAST(statistics.best_hard, EXCLUDED.best_hard)
            END`,
          bestExpert: sql`
            CASE
              WHEN statistics.best_expert IS NULL THEN EXCLUDED.best_expert
              WHEN EXCLUDED.best_expert IS NULL THEN statistics.best_expert
              ELSE LEAST(statistics.best_expert, EXCLUDED.best_expert)
            END`,
          currentStreak: sql`GREATEST(statistics.current_streak, EXCLUDED.current_streak)`,
          longestStreak: sql`GREATEST(statistics.longest_streak, EXCLUDED.longest_streak)`,
          // For completed_levels: merge arrays using PostgreSQL JSON array operations
          // to ensure we never LOSE levels even from concurrent writes across devices
          completedLevels: sql`(
            SELECT jsonb_agg(DISTINCT level)
            FROM (
              SELECT jsonb_array_elements_text(COALESCE(statistics.completed_levels, '[]'::jsonb)) AS level
              UNION
              SELECT jsonb_array_elements_text(COALESCE(EXCLUDED.completed_levels, '[]'::jsonb)) AS level
            ) merged
          )`,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result;
  } catch (error) {
    console.error("Database Error [updateStatistics]:", error);
    throw error;
  }
}
