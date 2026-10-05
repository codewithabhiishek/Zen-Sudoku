export interface LeaderboardEntry {
  id: string;
  userId: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  difficulty: string;
  score: number;
  time: number;
  mistakes: number;
  createdAt: string | Date;
}

export type LeaderboardPeriod = "global" | "daily" | "weekly" | "monthly" | "all_time";

/**
 * Compares two leaderboard entries for the same player/game.
 * Returns true if candidate `a` is strictly better than entry `b`.
 *
 * Evaluation Criteria:
 * 1. Higher score
 * 2. If tied on score: FEWEST mistakes (Sudoku precision priority!)
 * 3. If tied on mistakes: Fastest time
 * 4. If tied on time: Earliest achievement date
 */
export function isBetterEntry(a: LeaderboardEntry, b: LeaderboardEntry): boolean {
  if (a.score !== b.score) {
    return a.score > b.score;
  }
  if (a.mistakes !== b.mistakes) {
    return a.mistakes < b.mistakes; // Fewer mistakes is strictly better!
  }
  if (a.time !== b.time) {
    return a.time < b.time; // Faster time is better
  }
  const dateA = new Date(a.createdAt).getTime();
  const dateB = new Date(b.createdAt).getTime();
  if (!isNaN(dateA) && !isNaN(dateB)) {
    return dateA < dateB;
  }
  return false;
}

/**
 * Generates a unified identity key for deduplicating entries per player per difficulty.
 * Unifies registered user IDs, usernames, and display names so a player only occupies
 * their single best spot on the leaderboard.
 */
export function getPlayerKey(item: LeaderboardEntry): string {
  const normName = (item.displayName || item.username || "").trim().toLowerCase();
  const isNamed =
    normName.length > 0 &&
    !normName.startsWith("player #") &&
    normName !== "you" &&
    normName !== "guest";

  // If player has a recognized username/displayName, unify under their name
  if (isNamed) {
    return `name:${normName}`;
  }

  // Otherwise, use authenticated user ID
  if (item.userId && !item.userId.startsWith("guest_") && item.userId !== "local_player") {
    return `user:${item.userId}`;
  }

  return `id:${item.userId || item.id}`;
}

/**
 * Filter entries by the selected time period (daily, weekly, monthly, global/all_time).
 */
export function filterByPeriod(
  entries: LeaderboardEntry[],
  period: LeaderboardPeriod,
  now: number = Date.now(),
): LeaderboardEntry[] {
  if (period === "global" || period === "all_time") {
    return entries;
  }

  const DAY_MS = 24 * 60 * 60 * 1000;
  const cutoffMs = period === "daily" ? DAY_MS : period === "weekly" ? 7 * DAY_MS : 30 * DAY_MS;

  return entries.filter((item) => {
    const time = new Date(item.createdAt).getTime();
    if (isNaN(time)) return true;
    return now - time <= cutoffMs;
  });
}

/**
 * Sorts and deduplicates leaderboard entries so:
 * 1. Each player only has 1 spot per difficulty (their single best performance).
 * 2. Rankings prioritize Score (desc), Mistakes (asc), Time (asc).
 * 3. Period filtering is accurately applied.
 */
export function processLeaderboardEntries(
  fetchedEntries: LeaderboardEntry[],
  synthEntries: LeaderboardEntry[] = [],
  period: LeaderboardPeriod = "global",
  now: number = Date.now(),
): LeaderboardEntry[] {
  const bestMap = new Map<string, LeaderboardEntry>();

  const processItem = (item: LeaderboardEntry) => {
    const playerKey = getPlayerKey(item);
    const key = `${playerKey}-${item.difficulty.toLowerCase()}`;
    const existing = bestMap.get(key);

    if (!existing) {
      bestMap.set(key, item);
    } else if (isBetterEntry(item, existing)) {
      bestMap.set(key, {
        ...item,
        avatarUrl: item.avatarUrl || existing.avatarUrl || null,
      });
    } else {
      // Keep existing, but backfill avatarUrl if candidate has one
      if (!existing.avatarUrl && item.avatarUrl) {
        existing.avatarUrl = item.avatarUrl;
      }
    }
  };

  // Process server and synthetic local entries
  fetchedEntries.forEach(processItem);
  synthEntries.forEach(processItem);

  const deduplicated = Array.from(bestMap.values());

  // Apply period filter
  const filtered = filterByPeriod(deduplicated, period, now);

  // Sort: Score DESC, Mistakes ASC, Time ASC, CreatedAt ASC
  filtered.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.mistakes !== b.mistakes) return a.mistakes - b.mistakes; // FEWEST mistakes first!
    if (a.time !== b.time) return a.time - b.time; // FASTEST time first!
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    if (!isNaN(dateA) && !isNaN(dateB)) return dateA - dateB;
    return 0;
  });

  return filtered;
}
