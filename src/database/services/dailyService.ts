import * as dailyRepo from "../repositories/dailyRepository";

export async function getDailyChallenge(dateString: string) {
  return await dailyRepo.getDailyChallenge(dateString);
}

export async function saveDailyResult(data: {
  userId: string;
  challengeDate: string;
  time: number;
  mistakes: number;
  score: number;
}) {
  return await dailyRepo.saveDailyResult(data);
}

export async function getDailyResult(userId: string, dateString: string) {
  return await dailyRepo.getDailyResult(userId, dateString);
}
