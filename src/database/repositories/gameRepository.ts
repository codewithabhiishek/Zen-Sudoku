import { db } from "../index";
import { gameSessions, gameHistory } from "../schema";
import { eq } from "drizzle-orm";

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
