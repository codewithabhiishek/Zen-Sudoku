import * as leaderboardRepo from "../repositories/leaderboardRepository";

export async function getLeaderboard(difficulty?: string, limit = 50) {
  return await leaderboardRepo.getLeaderboard(difficulty, limit);
}

export async function addLeaderboardEntry(entry: {
  userId: string;
  difficulty: string;
  score: number;
  time: number;
  mistakes: number;
}) {
  return await leaderboardRepo.addLeaderboardEntry(entry);
}
