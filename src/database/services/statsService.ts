import * as statsRepo from "../repositories/statsRepository";

export async function getStatistics(userId: string) {
  return await statsRepo.getStatistics(userId);
}

export async function updateStatistics(userId: string, data: statsRepo.UpdateStatsData) {
  return await statsRepo.updateStatistics(userId, data);
}
