import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  date,
  primaryKey,
} from "drizzle-orm/pg-core";

// ==================================================
// 1. USERS TABLE
// ==================================================
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Guest or authenticated User ID
  email: varchar("email", { length: 255 }).unique(),
  username: varchar("username", { length: 100 }).unique(),
  displayName: varchar("display_name", { length: 100 }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==================================================
// 2. GAME SESSIONS TABLE
// ==================================================
export const gameSessions = pgTable("game_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  difficulty: varchar("difficulty", { length: 20 }).notNull(), // 'easy' | 'medium' | 'hard' | 'expert'
  status: varchar("status", { length: 20 }).default("in_progress").notNull(), // 'in_progress' | 'completed' | 'failed' | 'abandoned'
  elapsedTime: integer("elapsed_time").default(0).notNull(), // in seconds
  mistakes: integer("mistakes").default(0).notNull(),
  notesEnabled: boolean("notes_enabled").default(false).notNull(),
  boardState: jsonb("board_state").notNull(), // Array of CellState objects or numbers
  solution: jsonb("solution").notNull(), // Array of 81 solution numbers
  seed: text("seed"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==================================================
// 3. GAME HISTORY TABLE
// ==================================================
export const gameHistory = pgTable("game_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  gameSessionId: uuid("game_session_id").references(() => gameSessions.id, { onDelete: "set null" }),
  score: integer("score").default(0).notNull(),
  difficulty: varchar("difficulty", { length: 20 }).notNull(),
  timeSeconds: integer("time_seconds").notNull(),
  mistakes: integer("mistakes").default(0).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==================================================
// 4. STATISTICS TABLE
// ==================================================
export const statistics = pgTable("statistics", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  gamesPlayed: integer("games_played").default(0).notNull(),
  gamesWon: integer("games_won").default(0).notNull(),
  bestEasy: integer("best_easy"), // best time in seconds
  bestMedium: integer("best_medium"),
  bestHard: integer("best_hard"),
  bestExpert: integer("best_expert"),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  averageTime: integer("average_time").default(0).notNull(),
  completedLevels: jsonb("completed_levels").default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==================================================
// 5. ACHIEVEMENTS TABLE
// ==================================================
export const achievements = pgTable("achievements", {
  id: text("id").primaryKey(), // e.g. 'first_win', 'speed_demon'
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
});

// ==================================================
// 6. USER ACHIEVEMENTS TABLE
// ==================================================
export const userAchievements = pgTable(
  "user_achievements",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: text("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    earnedAt: timestamp("earned_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.achievementId] }),
  })
);

// ==================================================
// 7. DAILY CHALLENGE TABLE
// ==================================================
export const dailyChallenge = pgTable("daily_challenge", {
  date: date("date").primaryKey(), // YYYY-MM-DD
  seed: text("seed").notNull(),
  difficulty: varchar("difficulty", { length: 20 }).notNull(),
});

// ==================================================
// 8. DAILY RESULTS TABLE
// ==================================================
export const dailyResults = pgTable(
  "daily_results",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    challengeDate: date("challenge_date")
      .notNull()
      .references(() => dailyChallenge.date, { onDelete: "cascade" }),
    time: integer("time").notNull(), // seconds
    mistakes: integer("mistakes").default(0).notNull(),
    score: integer("score").default(0).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.challengeDate] }),
  })
);

// ==================================================
// 9. LEADERBOARD TABLE
// ==================================================
export const leaderboard = pgTable("leaderboard", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  difficulty: varchar("difficulty", { length: 20 }).notNull(),
  score: integer("score").notNull(),
  time: integer("time").notNull(),
  mistakes: integer("mistakes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
