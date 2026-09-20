import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeScore, applyWinToStats, type Stats } from "../../src/lib/sudoku/scoring.ts";
import type { Puzzle } from "../../src/lib/sudoku/types.ts";

describe("Scoring and Progression Mechanics", () => {
  const mockPuzzle: Puzzle = {
    puzzle: new Array(81).fill(0),
    solution: new Array(81).fill(1),
    difficulty: "easy",
    seed: "test-seed",
    clueCount: 35,
    levelNumber: 1,
  };

  it("should calculate score with bonuses and minimum guaranteed floor", () => {
    // Fast win, no mistakes, no hints -> maximum bonuses
    const scorePerfect = computeScore(mockPuzzle, 60, 0, 0);
    assert.ok(scorePerfect.timeBonus > 0);
    assert.ok(scorePerfect.noMistakeBonus > 0);
    assert.ok(scorePerfect.noHintBonus > 0);
    assert.equal(scorePerfect.mistakePenalty, 0);
    assert.equal(scorePerfect.hintPenalty, 0);
    assert.ok(scorePerfect.total >= scorePerfect.base);

    // Terrible run with lots of mistakes and hints -> should still hit 50% base floor
    const scoreBad = computeScore(mockPuzzle, 9999, 10, 10);
    assert.equal(scoreBad.total, Math.round(scoreBad.base * 0.5));
  });

  it("should track win stats, completed levels, and streaks accurately", () => {
    const initialStats: Stats = {
      gamesPlayed: 0,
      gamesWon: 0,
      bestTimeByDifficulty: {},
      totalPoints: 0,
      currentStreakDays: 0,
      longestStreakDays: 0,
      lastPlayedDate: null,
      completedLevels: [],
    };

    const score = computeScore(mockPuzzle, 120, 0, 0);
    const updated = applyWinToStats(initialStats, mockPuzzle, 120, score);

    assert.equal(updated.gamesWon, 1);
    assert.equal(updated.completedLevels.includes("easy-1"), true);
    assert.equal(updated.bestTimeByDifficulty["easy"], 120);
    assert.equal(updated.currentStreakDays, 1);
    assert.equal(updated.longestStreakDays, 1);

    // Winning another game today should maintain streak without double-counting
    const updatedAgain = applyWinToStats(updated, mockPuzzle, 90, score);
    assert.equal(updatedAgain.currentStreakDays, 1);
    assert.equal(updatedAgain.bestTimeByDifficulty["easy"], 90); // best time improved from 120 to 90
  });
});
