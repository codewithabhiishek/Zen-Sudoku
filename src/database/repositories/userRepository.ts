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
    console.error("Database Error [createUser]:", error);
    throw error;
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
