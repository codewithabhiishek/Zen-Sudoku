import * as gameRepo from "../repositories/gameRepository";
import * as leaderboardRepo from "../repositories/leaderboardRepository";
import * as statsRepo from "../repositories/statsRepository";

export async function saveGame(data: gameRepo.CreateGameSessionData) {
  return await gameRepo.saveGame(data);
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
  return await gameRepo.updateGame(sessionId, data);
}

export async function completeGame(
  sessionId: string,
  userId: string,
  difficulty: string,
  score: number,
  timeSeconds: number,
  mistakes: number
) {
  const history = await gameRepo.completeGame(
    sessionId,
    userId,
    difficulty,
    score,
    timeSeconds,
    mistakes
  );

  // Auto-post to leaderboard upon completion
  await leaderboardRepo.addLeaderboardEntry({
    userId,
    difficulty,
    score,
    time: timeSeconds,
    mistakes,
  });

  // Update user stats
  const currentStats = await statsRepo.getStatistics(userId);
  const gamesPlayed = (currentStats?.gamesPlayed ?? 0) + 1;
  const gamesWon = (currentStats?.gamesWon ?? 0) + 1;

  let bestKey: "bestEasy" | "bestMedium" | "bestHard" | "bestExpert" = "bestEasy";
  if (difficulty === "medium") bestKey = "bestMedium";
  if (difficulty === "hard") bestKey = "bestHard";
  if (difficulty === "expert") bestKey = "bestExpert";

  const prevBest = currentStats?.[bestKey];
  const newBest = prevBest == null ? timeSeconds : Math.min(prevBest, timeSeconds);

  await statsRepo.updateStatistics(userId, {
    gamesPlayed,
    gamesWon,
    [bestKey]: newBest,
    currentStreak: (currentStats?.currentStreak ?? 0) + 1,
    longestStreak: Math.max((currentStats?.longestStreak ?? 0), (currentStats?.currentStreak ?? 0) + 1),
  });

  return history;
}
