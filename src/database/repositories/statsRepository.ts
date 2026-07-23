import { db } from "../index";
import { statistics } from "../schema";
import { eq } from "drizzle-orm";

export async function getStatistics(userId: string) {
  try {
    const [stats] = await db.select().from(statistics).where(eq(statistics.userId, userId)).limit(1);
    return stats || null;
  } catch (error) {
    console.error("Database Error [getStatistics]:", error);
    return null;
  }
}

export interface UpdateStatsData {
  gamesPlayed?: number;
  gamesWon?: number;
  bestEasy?: number;
  bestMedium?: number;
  bestHard?: number;
  bestExpert?: number;
  currentStreak?: number;
  longestStreak?: number;
  averageTime?: number;
  completedLevels?: string[];
}

export async function updateStatistics(userId: string, data: UpdateStatsData) {
  try {
    const existing = await getStatistics(userId);

    if (!existing) {
      const [inserted] = await db
        .insert(statistics)
        .values({
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
          completedLevels: data.completedLevels ?? [],
          updatedAt: new Date(),
        })
        .returning();
      return inserted;
    }

    const [updated] = await db
      .update(statistics)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(statistics.userId, userId))
      .returning();

    return updated;
  } catch (error) {
    console.error("Database Error [updateStatistics]:", error);
    throw error;
  }
}
