import type { Difficulty, Puzzle } from "./types.ts";

export interface ScoreBreakdown {
  base: number;
  timeBonus: number;
  mistakePenalty: number;
  hintPenalty: number;
  noMistakeBonus: number;
  noHintBonus: number;
  total: number;
}

export interface Stats {
  gamesPlayed: number;
  gamesWon: number;
  bestTimeByDifficulty: Partial<Record<Difficulty, number>>;
  totalPoints: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastPlayedDate: string | null;
  completedLevels: string[]; // e.g. ["easy-1", "easy-2", "medium-3"]
}

export function baseFor(d: Difficulty): number {
  return { easy: 200, medium: 400, hard: 800, expert: 1500 }[d] || 200;
}

export function targetTimeSec(d: Difficulty): number {
  return { easy: 300, medium: 600, hard: 1200, expert: 1800 }[d] || 300;
}

export function computeScore(
  puzzle: Puzzle,
  timeSec: number,
  mistakes: number,
  hints: number,
): ScoreBreakdown {
  const safeTime = Math.max(0, Number.isFinite(timeSec) ? timeSec : 0);
  const safeMistakes = Math.max(0, Number.isFinite(mistakes) ? Math.floor(mistakes) : 0);
  const safeHints = Math.max(0, Number.isFinite(hints) ? Math.floor(hints) : 0);

  const base = baseFor(puzzle.difficulty);
  const target = targetTimeSec(puzzle.difficulty);
  const timeBonus = Math.max(0, Math.round(base * (1 - Math.min(1, safeTime / target)) * 0.6));
  const mistakePenalty = safeMistakes * 25;
  const hintPenalty = safeHints * 50;
  const noMistakeBonus = safeMistakes === 0 ? Math.round(base * 0.25) : 0;
  const noHintBonus = safeHints === 0 ? Math.round(base * 0.25) : 0;

  // Guaranteed minimum XP on level completion (always at least 50% of base XP!)
  const minGuaranteed = Math.round(base * 0.5);
  const calculatedTotal =
    base + timeBonus - mistakePenalty - hintPenalty + noMistakeBonus + noHintBonus;
  const total = Math.max(minGuaranteed, calculatedTotal);

  return { base, timeBonus, mistakePenalty, hintPenalty, noMistakeBonus, noHintBonus, total };
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // "2026-07-04" — always zero-padded
}

export function yesterdayKey(): string {
  return new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
}

/** Update stats after a confirmed win. Pure function — returns updated stats. */
export function applyWinToStats(
  stats: Stats,
  puzzle: Puzzle,
  timeSec: number,
  score: ScoreBreakdown,
): Stats {
  const safeStats: Stats = stats || {
    gamesPlayed: 0,
    gamesWon: 0,
    bestTimeByDifficulty: {},
    totalPoints: 0,
    currentStreakDays: 0,
    longestStreakDays: 0,
    lastPlayedDate: null,
    completedLevels: [],
  };
  const nextLevels = Array.from(new Set(safeStats.completedLevels ?? [])).filter(Boolean);
  const isLevelGame = puzzle.levelNumber != null;
  const levelKey = isLevelGame ? `${puzzle.difficulty}-${puzzle.levelNumber}` : null;

  if (levelKey && !nextLevels.includes(levelKey)) {
    nextLevels.push(levelKey);
  }

  const count = nextLevels.length;
  const totalPoints =
    count > 0
      ? nextLevels.reduce((sum, key) => {
          const diff = (key.split("-")[0] || "easy") as Difficulty;
          const base = { easy: 100, medium: 200, hard: 400, expert: 800 }[diff] || 100;
          return sum + base;
        }, 0)
      : (safeStats.totalPoints || 0) + score.total;

  const bestTimes = safeStats.bestTimeByDifficulty ?? {};
  const best = bestTimes[puzzle.difficulty];
  const safeTime = Math.max(0, Number.isFinite(timeSec) ? timeSec : 0);
  const newBestTime = best == null ? safeTime : Math.min(best, safeTime);
  const today = todayKey();
  let currentStreak = safeStats.currentStreakDays || 0;
  if (safeStats.lastPlayedDate === yesterdayKey()) currentStreak += 1;
  else if (safeStats.lastPlayedDate !== today) currentStreak = 1;
  const longestStreak = Math.max(safeStats.longestStreakDays || 0, currentStreak);

  const next = {
    ...safeStats,
    completedLevels: nextLevels,
    gamesWon: count > 0 ? count : safeStats.gamesWon + 1,
    gamesPlayed: count > 0 ? count : safeStats.gamesPlayed + 1,
    totalPoints,
    bestTimeByDifficulty: {
      ...bestTimes,
      [puzzle.difficulty]: newBestTime,
    },
    currentStreakDays: currentStreak,
    longestStreakDays: longestStreak,
    lastPlayedDate: today,
  };
  return next;
}
