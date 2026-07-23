import { db } from "../index";
import { leaderboard, users } from "../schema";
import { eq, desc, asc } from "drizzle-orm";

export async function getLeaderboard(difficulty?: string, limit = 50) {
  try {
    const query = db
      .select({
        id: leaderboard.id,
        userId: leaderboard.userId,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        difficulty: leaderboard.difficulty,
        score: leaderboard.score,
        time: leaderboard.time,
        mistakes: leaderboard.mistakes,
        createdAt: leaderboard.createdAt,
      })
      .from(leaderboard)
      .leftJoin(users, eq(leaderboard.userId, users.id));

    if (difficulty) {
      return await query
        .where(eq(leaderboard.difficulty, difficulty))
        .orderBy(desc(leaderboard.score), asc(leaderboard.time))
        .limit(limit);
    }

    return await query.orderBy(desc(leaderboard.score), asc(leaderboard.time)).limit(limit);
  } catch (error) {
    console.error("Database Error [getLeaderboard]:", error);
    return [];
  }
}

export async function addLeaderboardEntry(data: {
  userId: string;
  difficulty: string;
  score: number;
  time: number;
  mistakes: number;
}) {
  try {
    const [inserted] = await db
      .insert(leaderboard)
      .values({
        userId: data.userId,
        difficulty: data.difficulty,
        score: data.score,
        time: data.time,
        mistakes: data.mistakes,
      })
      .returning();
    return inserted;
  } catch (error) {
    console.error("Database Error [addLeaderboardEntry]:", error);
    throw error;
  }
}
