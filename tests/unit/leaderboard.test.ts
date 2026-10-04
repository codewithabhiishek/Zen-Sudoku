import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isBetterEntry,
  processLeaderboardEntries,
  filterByPeriod,
  type LeaderboardEntry,
} from "../../src/lib/sudoku/leaderboardUtils.ts";

describe("Leaderboard Logic & Ranking Correctness", () => {
  const entry402Mistakes: LeaderboardEntry = {
    id: "entry-1",
    userId: "user_clerk_123",
    username: "abhiishek",
    displayName: "abhiishek",
    avatarUrl: "https://avatar.url/pic.png",
    difficulty: "easy",
    score: 100,
    time: 157, // 2m 37s
    mistakes: 402,
    createdAt: new Date("2026-10-04T10:00:00Z"),
  };

  const entry23Mistakes: LeaderboardEntry = {
    id: "entry-2",
    userId: "guest_player_456",
    username: "abhiishek",
    displayName: "abhiishek",
    avatarUrl: null,
    difficulty: "easy",
    score: 100,
    time: 645, // 10m 45s
    mistakes: 23,
    createdAt: new Date("2026-10-04T11:00:00Z"),
  };

  it("should evaluate 23 mistakes as strictly better than 402 mistakes on equal scores", () => {
    // Both have 100 pts. 23 mistakes must beat 402 mistakes even though 402 mistakes had faster time
    assert.equal(isBetterEntry(entry23Mistakes, entry402Mistakes), true);
    assert.equal(isBetterEntry(entry402Mistakes, entry23Mistakes), false);
  });

  it("should rank players with fewer mistakes higher when scores are tied", () => {
    const playerA: LeaderboardEntry = {
      ...entry402Mistakes,
      userId: "user_a",
      username: "PlayerA",
      displayName: "PlayerA",
    };
    const playerB: LeaderboardEntry = {
      ...entry23Mistakes,
      userId: "user_b",
      username: "PlayerB",
      displayName: "PlayerB",
    };

    const sorted = processLeaderboardEntries([playerA, playerB]);

    assert.equal(sorted.length, 2);
    // PlayerB with 23 mistakes MUST be Rank 1!
    assert.equal(sorted[0].username, "PlayerB");
    assert.equal(sorted[0].mistakes, 23);
    // PlayerA with 402 mistakes MUST be Rank 2!
    assert.equal(sorted[1].username, "PlayerA");
    assert.equal(sorted[1].mistakes, 402);
  });

  it("should deduplicate multiple runs by the same player on the same difficulty and keep their best record", () => {
    // Both entries belong to abhiishek on easy
    const processed = processLeaderboardEntries([entry402Mistakes, entry23Mistakes]);

    // Should only have 1 entry for abhiishek
    assert.equal(processed.length, 1);
    assert.equal(processed[0].username, "abhiishek");
    // Should keep the 23-mistake run, NOT the 402-mistake run!
    assert.equal(processed[0].mistakes, 23);
    assert.equal(processed[0].time, 645);
    // Should preserve avatarUrl from the Clerk profile
    assert.equal(processed[0].avatarUrl, "https://avatar.url/pic.png");
  });

  it("should correctly prioritize higher scores regardless of mistakes", () => {
    const highScorer: LeaderboardEntry = {
      id: "entry-high",
      userId: "user_3",
      username: "HighScorer",
      displayName: "HighScorer",
      avatarUrl: null,
      difficulty: "easy",
      score: 350,
      time: 120,
      mistakes: 2,
      createdAt: new Date("2026-10-04T09:00:00Z"),
    };

    const sorted = processLeaderboardEntries([entry23Mistakes, highScorer]);
    assert.equal(sorted[0].username, "HighScorer");
    assert.equal(sorted[0].score, 350);
  });

  it("should filter entries by daily, weekly, and monthly periods", () => {
    const now = new Date("2026-10-04T12:00:00Z").getTime();
    const todayEntry: LeaderboardEntry = {
      ...entry23Mistakes,
      id: "today",
      createdAt: new Date("2026-10-04T08:00:00Z"),
    };
    const yesterdayEntry: LeaderboardEntry = {
      ...entry23Mistakes,
      id: "yesterday",
      userId: "user_old",
      username: "OldPlayer",
      createdAt: new Date("2026-10-01T12:00:00Z"), // 3 days ago
    };
    const lastMonthEntry: LeaderboardEntry = {
      ...entry23Mistakes,
      id: "last-month",
      userId: "user_ancient",
      username: "AncientPlayer",
      createdAt: new Date("2026-08-01T12:00:00Z"), // 2 months ago
    };

    const entries = [todayEntry, yesterdayEntry, lastMonthEntry];

    const daily = filterByPeriod(entries, "daily", now);
    assert.equal(daily.length, 1);
    assert.equal(daily[0].id, "today");

    const weekly = filterByPeriod(entries, "weekly", now);
    assert.equal(weekly.length, 2);

    const monthly = filterByPeriod(entries, "monthly", now);
    assert.equal(monthly.length, 2);

    const globalAll = filterByPeriod(entries, "global", now);
    assert.equal(globalAll.length, 3);
  });
});
