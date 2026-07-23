import { db } from "../index";
import { dailyChallenge, dailyResults } from "../schema";
import { eq, and } from "drizzle-orm";

export async function getDailyChallenge(dateString: string) {
  try {
    const [challenge] = await db
      .select()
      .from(dailyChallenge)
      .where(eq(dailyChallenge.date, dateString))
      .limit(1);
    return challenge || null;
  } catch (error) {
    console.error("Database Error [getDailyChallenge]:", error);
    return null;
  }
}

export async function saveDailyResult(data: {
  userId: string;
  challengeDate: string;
  time: number;
  mistakes: number;
  score: number;
}) {
  try {
    const [inserted] = await db
      .insert(dailyResults)
      .values({
        userId: data.userId,
        challengeDate: data.challengeDate,
        time: data.time,
        mistakes: data.mistakes,
        score: data.score,
      })
      .onConflictDoUpdate({
        target: [dailyResults.userId, dailyResults.challengeDate],
        set: {
          time: data.time,
          mistakes: data.mistakes,
          score: data.score,
        },
      })
      .returning();
    return inserted;
  } catch (error) {
    console.error("Database Error [saveDailyResult]:", error);
    throw error;
  }
}

export async function getDailyResult(userId: string, dateString: string) {
  try {
    const [result] = await db
      .select()
      .from(dailyResults)
      .where(and(eq(dailyResults.userId, userId), eq(dailyResults.challengeDate, dateString)))
      .limit(1);
    return result || null;
  } catch (error) {
    console.error("Database Error [getDailyResult]:", error);
    return null;
  }
}
