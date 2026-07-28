import { useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useUserStore } from "@/store/userStore";
import { useGameStore } from "@/store/gameStore";
import { getStatistics, updateStatistics, createUser, getActiveGameSession, saveGame } from "@/database/api";

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

          // Step 5: Merge games played/won — sanitize with completed levels count
          const completedCount = mergedLevels.length;
          const mergedWon = completedCount > 0
            ? completedCount
            : Math.max(localStats.gamesWon ?? 0, cloudStats?.gamesWon ?? 0);
          const mergedPlayed = Math.max(
            localStats.gamesPlayed ?? 0,
            cloudStats?.gamesPlayed ?? 0,
            mergedWon
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

          // Step 11: Sync active in-progress game between devices (iPhone <-> Desktop)
          const activeSession = await getActiveGameSession(user.id);
          const currentStore = useGameStore.getState();
          if (!currentStore.won && activeSession && activeSession.status === "in_progress" && activeSession.boardState) {
            const cloudCells = (activeSession.boardState as any).cells || [];
            const cloudPuzzle = (activeSession.boardState as any).puzzle || [];
            const cloudSolution = (activeSession.solution as any) || [];

            if (cloudCells.length === 81 && cloudPuzzle.length === 81) {
              console.log("[SyncBridge] 🎮 Syncing active in-progress game from cloud...");
              useGameStore.setState({
                puzzle: {
                  puzzle: cloudPuzzle,
                  solution: cloudSolution,
                  difficulty: activeSession.difficulty as Difficulty,
                  clueCount: cloudPuzzle.filter((v: number) => v !== 0).length,
                  seed: activeSession.seed || undefined,
                },
                cells: cloudCells,
                elapsedMs: (activeSession.elapsedTime || 0) * 1000,
                mistakes: activeSession.mistakes || 0,
                running: true,
                paused: false,
                won: false,
              });
            }
          }

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

    // Step 12: Real-time background sync every 4 seconds when tab is active
    const runRealtimeSync = async () => {
      if (!isSignedIn || !user || document.hidden) return;
      try {
        const currentStore = useGameStore.getState();

        // 1. Poll cloud statistics for real-time level completion sync (iPhone -> Laptop)
        const cloudStats = await getStatistics(user.id);
        if (cloudStats && Array.isArray(cloudStats.completedLevels)) {
          const cloudLevels = cloudStats.completedLevels as string[];
          const localLevels = currentStore.stats.completedLevels ?? [];
          const mergedLevels = Array.from(new Set([...localLevels, ...cloudLevels]));
          if (mergedLevels.length > localLevels.length) {
            console.log("[SyncBridge] ⚡ Real-time level completion sync from cloud!", mergedLevels);
            useGameStore.setState({
              stats: {
                ...currentStore.stats,
                completedLevels: mergedLevels,
                gamesWon: mergedLevels.length,
                gamesPlayed: mergedLevels.length,
              },
            });
          }
        }

        // 2. Poll active game session for move sync or game completion (iPhone -> Laptop)
        const activeSession = await getActiveGameSession(user.id);

        if (activeSession && activeSession.status === "in_progress" && activeSession.boardState) {
          const cloudCells = (activeSession.boardState as any).cells || [];
          const cloudPuzzle = (activeSession.boardState as any).puzzle || [];
          const cloudSolution = (activeSession.solution as any) || [];

          if (cloudCells.length === 81 && !currentStore.won) {
            const cloudFilled = cloudCells.filter((c: any) => c.value !== 0).length;
            const localFilled = (currentStore.cells || []).filter((c: any) => c.value !== 0).length;

            // Update if cloud has newer moves played on another device
            if (cloudFilled > localFilled || (cloudFilled === localFilled && Math.abs(Math.floor(currentStore.elapsedMs / 1000) - activeSession.elapsedTime) > 3)) {
              console.log("[SyncBridge] ⚡ Real-time move sync from secondary device!");
              useGameStore.setState({
                puzzle: {
                  puzzle: cloudPuzzle,
                  solution: cloudSolution,
                  difficulty: activeSession.difficulty as Difficulty,
                  clueCount: cloudPuzzle.filter((v: number) => v !== 0).length,
                  seed: activeSession.seed || undefined,
                },
                cells: cloudCells,
                elapsedMs: (activeSession.elapsedTime || 0) * 1000,
                mistakes: activeSession.mistakes || 0,
                running: true,
                won: false,
              });
            }
          }
        } else if (!activeSession && currentStore.puzzle && !currentStore.won) {
          // Cloud has NO in-progress session (game was completed on phone), but local laptop store still has active puzzle.
          // Reset local puzzle state so Resume banner disappears on laptop!
          console.log("[SyncBridge] 🧹 Game completed on secondary device — clearing active session on this device!");
          currentStore.reset();
        }
      } catch (err) {
        // Ignore polling glitches
      }
    };

    const activePollInterval = setInterval(runRealtimeSync, 4000);

    const handleVisibilityChange = () => {
      if (!document.hidden) runRealtimeSync();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(activePollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoaded, isSignedIn, user?.id]); // Depend on user.id specifically, not entire user object

  return null;
}
