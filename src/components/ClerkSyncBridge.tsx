import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useUserStore } from "@/store/userStore";
import { useGameStore } from "@/store/gameStore";
import { getStatistics, updateStatistics, createUser } from "@/database/api";

type Difficulty = "easy" | "medium" | "hard" | "expert";

export function ClerkSyncBridge() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    const syncAuth = async () => {
      const userStore = useUserStore.getState();
      const gameStore = useGameStore.getState();

      if (isSignedIn && user) {
        // 1. If stored user ID matches user.id, we are already synced
        if (userStore.userId === user.id) return;

        console.log("[SyncBridge] User signed in via Clerk. Initializing sync for ID:", user.id);

        try {
          // 2. Upsert user profile in Neon DB
          await createUser({
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress || "",
            username: user.username || user.firstName || "ZenPlayer",
            displayName: user.fullName || user.username || user.firstName || "ZenPlayer",
            avatarUrl: user.imageUrl,
          });

          // 3. Fetch cloud stats
          const cloudStats = await getStatistics(user.id);
          const localStats = gameStore.stats;

          // 4. Merge completed levels
          const localLevels = localStats.completedLevels ?? [];
          const cloudLevels = (cloudStats?.completedLevels as string[]) ?? [];
          const mergedLevels = Array.from(new Set([...localLevels, ...cloudLevels]));

          // 5. Merge best solve times
          const mergedBestTimes = { ...(localStats.bestTimeByDifficulty ?? {}) };
          if (cloudStats) {
            const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert"];
            const dbFields = {
              easy: "bestEasy" as const,
              medium: "bestMedium" as const,
              hard: "bestHard" as const,
              expert: "bestExpert" as const,
            };

            difficulties.forEach((diff) => {
              const dbField = dbFields[diff];
              const cloudBest = cloudStats[dbField];
              const localBest = localStats.bestTimeByDifficulty?.[diff];

              if (cloudBest != null && cloudBest > 0) {
                if (localBest == null || localBest <= 0 || cloudBest < localBest) {
                  mergedBestTimes[diff] = cloudBest;
                }
              }
            });
          }

          // 6. Merge games played / games won
          const cloudPlayed = cloudStats?.gamesPlayed ?? 0;
          const cloudWon = cloudStats?.gamesWon ?? 0;
          const localPlayed = localStats.gamesPlayed ?? 0;
          const localWon = localStats.gamesWon ?? 0;

          const mergedPlayed = Math.max(localPlayed, cloudPlayed, mergedLevels.length);
          const mergedWon = Math.max(localWon, cloudWon, mergedLevels.length);

          // 7. Calculate total points based on merged completed levels
          const baseFor = (d: Difficulty): number => {
            return { easy: 200, medium: 400, hard: 800, expert: 1500 }[d];
          };
          const minExpectedPoints = mergedLevels.reduce((sum, key) => {
            const diff = (key.split("-")[0] || "easy") as Difficulty;
            const base = baseFor(diff);
            return sum + Math.round(base * 0.5);
          }, 0);

          const localPoints = localStats.totalPoints ?? 0;
          const mergedPoints = Math.max(localPoints, minExpectedPoints);

          // 8. Construct merged stats payload
          const mergedStats = {
            ...localStats,
            completedLevels: mergedLevels,
            bestTimeByDifficulty: mergedBestTimes,
            gamesPlayed: mergedPlayed,
            gamesWon: mergedWon,
            totalPoints: mergedPoints,
            currentStreakDays: Math.max(localStats.currentStreakDays ?? 0, cloudStats?.currentStreak ?? 0),
            longestStreakDays: Math.max(localStats.longestStreakDays ?? 0, cloudStats?.longestStreak ?? 0),
          };

          // 9. Push merged stats to Neon DB
          await updateStatistics(user.id, {
            gamesPlayed: mergedPlayed,
            gamesWon: mergedWon,
            completedLevels: mergedLevels,
            bestEasy: mergedBestTimes.easy ?? null,
            bestMedium: mergedBestTimes.medium ?? null,
            bestHard: mergedBestTimes.hard ?? null,
            bestExpert: mergedBestTimes.expert ?? null,
            currentStreak: mergedStats.currentStreakDays,
            longestStreak: mergedStats.longestStreakDays,
          });

          // 10. Update local Zustand state
          useUserStore.setState({
            userId: user.id,
            username: user.username || user.firstName || "ZenPlayer",
            displayName: user.fullName || user.username || user.firstName || "ZenPlayer",
            avatarUrl: user.imageUrl,
            isRegistered: true,
          });

          useGameStore.setState({ stats: mergedStats });

          console.log("[SyncBridge] Sync complete. Merged data updated locally and saved to Neon DB.");
        } catch (err) {
          console.error("[SyncBridge] Sync failed:", err);
        }
      } else {
        // User is signed out. If current userId is a Clerk ID, revert back to offline Guest mode
        if (userStore.userId && userStore.userId.startsWith("user_")) {
          console.log("[SyncBridge] User signed out. Reverting to Guest profile.");
          userStore.deleteProfile();
          // Generate a guest ID
          const guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
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
  }, [isLoaded, isSignedIn, user]);

  return null;
}
