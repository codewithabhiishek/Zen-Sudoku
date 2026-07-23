import { useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useUserStore } from "@/store/userStore";
import { useGameStore } from "@/store/gameStore";
import { getStatistics, updateStatistics, createUser } from "@/database/api";

type Difficulty = "easy" | "medium" | "hard" | "expert";

const DB_FIELDS = {
  easy: "bestEasy" as const,
  medium: "bestMedium" as const,
  hard: "bestHard" as const,
  expert: "bestExpert" as const,
};

function baseFor(d: Difficulty): number {
  return { easy: 200, medium: 400, hard: 800, expert: 1500 }[d];
}

export function ClerkSyncBridge() {
  const { isLoaded, isSignedIn, user } = useUser();
  // Track the last synced user ID to avoid double-syncing
  const lastSyncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const syncAuth = async () => {
      const userStore = useUserStore.getState();
      const gameStore = useGameStore.getState();

      if (isSignedIn && user) {
        // Only skip if we JUST synced this exact user
        if (lastSyncedUserId.current === user.id) return;

        console.log("[SyncBridge] 🔄 Starting Cloud Sync for user:", user.id);

        try {
          const emailPrefix =
            user.primaryEmailAddress?.emailAddress?.split("@")[0] || "player";
          const uniqueUsername =
            user.username || `${emailPrefix}_${user.id.slice(-6)}`;

          // Step 1: Upsert user profile in Neon DB
          await createUser({
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress || "",
            username: uniqueUsername,
            displayName:
              user.fullName ||
              user.username ||
              user.firstName ||
              "ZenPlayer",
            avatarUrl: user.imageUrl,
          });

          // Step 2: Fetch cloud stats
          const cloudStats = await getStatistics(user.id);
          const localStats = gameStore.stats;

          console.log("[SyncBridge] Local completedLevels:", localStats.completedLevels);
          console.log("[SyncBridge] Cloud completedLevels:", cloudStats?.completedLevels);

          // Step 3: Merge completed levels — union of local + cloud, never lose data
          const localLevels: string[] = Array.isArray(localStats.completedLevels)
            ? localStats.completedLevels
            : [];
          const cloudLevels: string[] = Array.isArray(cloudStats?.completedLevels)
            ? (cloudStats.completedLevels as string[])
            : [];
          const mergedLevels = Array.from(new Set([...localLevels, ...cloudLevels]));

          console.log("[SyncBridge] Merged completedLevels:", mergedLevels);

          // Step 4: Merge best solve times — always keep the BEST (lowest) time
          const mergedBestTimes: Partial<Record<Difficulty, number>> = {
            ...(localStats.bestTimeByDifficulty ?? {}),
          };
          if (cloudStats) {
            (["easy", "medium", "hard", "expert"] as Difficulty[]).forEach((diff) => {
              const dbField = DB_FIELDS[diff];
              const cloudBest = cloudStats[dbField] as number | null | undefined;
              const localBest = mergedBestTimes[diff];
              if (cloudBest != null && cloudBest > 0) {
                if (localBest == null || localBest <= 0 || cloudBest < localBest) {
                  mergedBestTimes[diff] = cloudBest;
                }
              }
            });
          }

          // Step 5: Merge games played/won — always take the max
          const mergedPlayed = Math.max(
            localStats.gamesPlayed ?? 0,
            cloudStats?.gamesPlayed ?? 0,
            mergedLevels.length
          );
          const mergedWon = Math.max(
            localStats.gamesWon ?? 0,
            cloudStats?.gamesWon ?? 0,
            mergedLevels.length
          );

          // Step 6: Calculate total points — guarantee minimum XP per level
          const minExpectedPoints = mergedLevels.reduce((sum, key) => {
            const diff = (key.split("-")[0] || "easy") as Difficulty;
            return sum + Math.round(baseFor(diff) * 0.5);
          }, 0);
          const mergedPoints = Math.max(
            localStats.totalPoints ?? 0,
            minExpectedPoints
          );

          // Step 7: Merge streaks
          const mergedCurrentStreak = Math.max(
            localStats.currentStreakDays ?? 0,
            cloudStats?.currentStreak ?? 0
          );
          const mergedLongestStreak = Math.max(
            localStats.longestStreakDays ?? 0,
            cloudStats?.longestStreak ?? 0
          );

          // Step 8: Build the final merged stats object
          const mergedStats = {
            ...localStats,
            completedLevels: mergedLevels,
            bestTimeByDifficulty: mergedBestTimes,
            gamesPlayed: mergedPlayed,
            gamesWon: mergedWon,
            totalPoints: mergedPoints,
            currentStreakDays: mergedCurrentStreak,
            longestStreakDays: mergedLongestStreak,
          };

          // Step 9: Push merged stats to Neon DB — always push so cloud stays up-to-date
          await updateStatistics(user.id, {
            gamesPlayed: mergedPlayed,
            gamesWon: mergedWon,
            completedLevels: mergedLevels,
            bestEasy: mergedBestTimes.easy ?? null,
            bestMedium: mergedBestTimes.medium ?? null,
            bestHard: mergedBestTimes.hard ?? null,
            bestExpert: mergedBestTimes.expert ?? null,
            currentStreak: mergedCurrentStreak,
            longestStreak: mergedLongestStreak,
          });

          // Step 10: Update Zustand stores with merged data
          useUserStore.setState({
            userId: user.id,
            username:
              user.username || user.firstName || "ZenPlayer",
            displayName:
              user.fullName ||
              user.username ||
              user.firstName ||
              "ZenPlayer",
            avatarUrl: user.imageUrl,
            isRegistered: true,
          });

          useGameStore.setState({ stats: mergedStats });

          // Mark this user as synced — prevents repeat sync in same session
          lastSyncedUserId.current = user.id;

          console.log(
            `[SyncBridge] ✅ Sync complete! ${mergedLevels.length} levels, ${mergedPoints} XP synced.`
          );
        } catch (err) {
          console.error("[SyncBridge] ❌ Sync failed:", err);
          // Don't set lastSyncedUserId so it retries on next render
        }
      } else if (!isSignedIn) {
        // User signed out — revert to guest mode if previously a Clerk user
        if (userStore.userId && userStore.userId.startsWith("user_")) {
          console.log("[SyncBridge] User signed out. Reverting to Guest profile.");
          // Clear the sync tracker so next login triggers fresh sync
          lastSyncedUserId.current = null;
          userStore.deleteProfile();
          const guestId = `guest_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 9)}`;
          localStorage.setItem("zen_sudoku_user_id", guestId);
          useUserStore.setState({
            userId: guestId,
            username: `ZenPlayer_${Math.floor(1000 + Math.random() * 9000)}`,
            isRegistered: true,
          });
        }
      }
    };

    syncAuth();
  }, [isLoaded, isSignedIn, user?.id]); // Depend on user.id specifically, not entire user object

  return null;
}
