import { db } from "../index";
import { gameSessions, gameHistory } from "../schema";
import { eq, and } from "drizzle-orm";

export interface CreateGameSessionData {
  userId: string;
  difficulty: string;
  status?: string;
  elapsedTime?: number;
  mistakes?: number;
  notesEnabled?: boolean;
  boardState: unknown;
  solution: unknown;
  seed?: string;
}

export async function saveGame(data: CreateGameSessionData) {
  try {
    const [inserted] = await db
      .insert(gameSessions)
      .values({
        userId: data.userId,
        difficulty: data.difficulty,
        status: data.status || "in_progress",
        elapsedTime: data.elapsedTime || 0,
        mistakes: data.mistakes || 0,
        notesEnabled: data.notesEnabled || false,
        boardState: data.boardState,
        solution: data.solution,
        seed: data.seed || null,
        updatedAt: new Date(),
      })
      .returning();
    return inserted;
  } catch (error) {
    console.error("Database Error [saveGame]:", error);
    throw error;
  }
}

export async function updateGame(
  sessionId: string,
  data: Partial<{
    status: string;
    elapsedTime: number;
    mistakes: number;
    notesEnabled: boolean;
    boardState: unknown;
    completedAt: Date;
  }>
) {
  try {
    const [updated] = await db
      .update(gameSessions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(gameSessions.id, sessionId))
      .returning();
    return updated;
  } catch (error) {
    console.error("Database Error [updateGame]:", error);
    throw error;
  }
}

export async function completeGame(
  sessionId: string,
  userId: string,
  difficulty: string,
  score: number,
  timeSeconds: number,
  mistakes: number
) {
  try {
    const now = new Date();
    // 1. Update session status
    await db
      .update(gameSessions)
      .set({
        status: "completed",
        elapsedTime: timeSeconds,
        mistakes,
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(gameSessions.id, sessionId));

    // 2. Insert into game history
    const [historyEntry] = await db
      .insert(gameHistory)
      .values({
        userId,
        gameSessionId: sessionId,
        score,
        difficulty,
        timeSeconds,
        mistakes,
        completedAt: now,
      })
      .returning();

    return historyEntry;
  } catch (error) {
    console.error("Database Error [completeGame]:", error);
    throw error;
  }
}

export async function clearActiveGameSessions(userId: string) {
  try {
    await db
      .update(gameSessions)
      .set({ status: "completed", updatedAt: new Date() })
      .where(and(eq(gameSessions.userId, userId), eq(gameSessions.status, "in_progress")));
  } catch (error) {
    console.error("Database Error [clearActiveGameSessions]:", error);
  }
}

export async function getActiveGameSession(userId: string) {
  try {
    const sessions = await db
      .select()
      .from(gameSessions)
      .where(and(eq(gameSessions.userId, userId), eq(gameSessions.status, "in_progress")))
      .limit(10);
    if (!sessions.length) return null;
    sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return sessions[0];
  } catch (error) {
    console.error("Database Error [getActiveGameSession]:", error);
    return null;
  }
}

export async function upsertActiveGameSession(data: {
  userId: string;
  difficulty: string;
  elapsedTime: number;
  mistakes: number;
  boardState: unknown;
  solution: unknown;
  seed?: string;
  status?: string;
}) {
  try {
    if (data.status === "completed") {
      await clearActiveGameSessions(data.userId);
      return null;
    }

    const active = await getActiveGameSession(data.userId);
    const now = new Date();
    if (active) {
      const [updated] = await db
        .update(gameSessions)
        .set({
          elapsedTime: data.elapsedTime,
          mistakes: data.mistakes,
          boardState: data.boardState,
          status: data.status || "in_progress",
          updatedAt: now,
        })
        .where(eq(gameSessions.id, active.id))
        .returning();
      return updated;
    } else {
      return await saveGame({
        userId: data.userId,
        difficulty: data.difficulty,
        status: data.status || "in_progress",
        elapsedTime: data.elapsedTime,
        mistakes: data.mistakes,
        boardState: data.boardState,
        solution: data.solution,
        seed: data.seed,
      });
    }
  } catch (error) {
    console.error("Database Error [upsertActiveGameSession]:", error);
    return null;
  }
}
