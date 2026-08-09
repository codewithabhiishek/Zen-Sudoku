import { db } from "../index";
import { users } from "../schema";
import { eq } from "drizzle-orm";

export interface CreateUserData {
  id: string;
  email?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
}

export async function createUser(data: CreateUserData) {
  try {
    const [inserted] = await db
      .insert(users)
      .values({
        id: data.id,
        email: data.email ?? null,
        username: data.username ?? null,
        displayName: data.displayName ?? null,
        avatarUrl: data.avatarUrl ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: data.email ?? null,
          username: data.username ?? null,
          displayName: data.displayName ?? null,
          avatarUrl: data.avatarUrl ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();
    return inserted;
  } catch (error) {
    console.warn("Database Warning [createUser]: Unique constraint or sync collision, attempting graceful fallback...", error);
    try {
      const [existing] = await db.select().from(users).where(eq(users.id, data.id)).limit(1);
      if (existing) {
        const [updated] = await db
          .update(users)
          .set({
            displayName: data.displayName ?? existing.displayName,
            avatarUrl: data.avatarUrl ?? existing.avatarUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, data.id))
          .returning();
        return updated;
      }
    } catch (fallbackErr) {
      console.error("Fallback createUser error:", fallbackErr);
    }
    return null;
  }
}

export async function getUserById(id: string) {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user || null;
  } catch (error) {
    console.error("Database Error [getUserById]:", error);
    return null;
  }
}
