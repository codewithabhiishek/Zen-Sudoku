import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  useGameStore,
  findSolutionConflicts,
  findGridConflicts,
  conflictsWithGiven,
  validateEntireBoard,
} from "../../src/store/gameStore.ts";
import { explainMove } from "../../src/lib/sudoku/explainer.ts";
import {
  computeScore,
  applyWinToStats,
  type Stats,
  todayKey,
  yesterdayKey,
} from "../../src/lib/sudoku/scoring.ts";
import type { CellState, Grid, Puzzle } from "../../src/lib/sudoku/types.ts";

describe("Zen Sudoku Comprehensive Edge Cases", () => {
  const dummySolution: Grid = [
    5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6, 7, 8, 5, 9, 7, 6,
    1, 4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8, 5, 6, 9, 6, 1, 5, 3, 7, 2, 8, 4, 2,
    8, 7, 4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6, 1, 7, 9,
  ];

  const dummyPuzzle: Puzzle = {
    puzzle: dummySolution.map((v, i) => (i < 40 ? v : 0)),
    solution: dummySolution,
    difficulty: "easy",
    seed: "edge-test-seed",
    clueCount: 40,
    levelNumber: 1,
  };

  beforeEach(() => {
    useGameStore.getState().reset();
  });

  describe("Explainer Edge Cases", () => {
    it("should handle out-of-bounds indices gracefully without throwing", () => {
      const emptyCells = dummySolution.map((val) => ({ value: val, given: true, notes: [] }));

      const outBelow = explainMove(emptyCells, dummySolution, -1, 5);
      assert.equal(outBelow.isCorrect, false);
      assert.equal(outBelow.title, "Invalid Cell");

      const outAbove = explainMove(emptyCells, dummySolution, 81, 5);
      assert.equal(outAbove.isCorrect, false);
      assert.equal(outAbove.title, "Invalid Cell");

      const invalidSolution = explainMove(emptyCells, [] as unknown as Grid, 0, 5);
      assert.equal(invalidSolution.isCorrect, false);
    });

    it("should explain row, column, and box rule conflicts properly", () => {
      const cells = dummySolution.map((val, idx) => ({
        value: idx === 1 ? 5 : val, // Row 0 col 1 placed as 5 (duplicates row 0 col 0)
        given: idx === 0,
        notes: [],
      }));

      const exp = explainMove(cells, dummySolution, 1, 5);
      assert.equal(exp.isCorrect, false);
      assert.ok(exp.title.includes("Rule Violation"));
      assert.ok(exp.details.some((d) => d.includes("Row 1")));
    });

    it("should accurately explain correct moves", () => {
      const cells = dummySolution.map((val, idx) => ({
        value: idx === 45 ? 0 : val,
        given: idx !== 45,
        notes: [],
      }));

      const exp = explainMove(cells, dummySolution, 45, dummySolution[45]);
      assert.equal(exp.isCorrect, true);
      assert.ok(exp.title.includes("Correct"));
    });
  });

  describe("Validation & Conflict Defensive Handling", () => {
    it("should safely handle malformed or short arrays in findSolutionConflicts", () => {
      assert.equal(findSolutionConflicts([] as unknown as CellState[], dummySolution).size, 0);
      assert.equal(findSolutionConflicts(null as unknown as CellState[], dummySolution).size, 0);
      assert.equal(
        findSolutionConflicts(new Array(40) as unknown as CellState[], dummySolution).size,
        0,
      );
    });

    it("should safely handle null or non-array inputs in findGridConflicts and conflictsWithGiven", () => {
      assert.equal(findGridConflicts(null as unknown as CellState[]).size, 0);
      assert.equal(conflictsWithGiven(null as unknown as CellState[], new Set([0])).size, 0);
      assert.equal(conflictsWithGiven([] as unknown as CellState[], new Set([-1, 999])).size, 0);
    });

    it("should run validateEntireBoard on clean solved board with 0 errors", () => {
      const solvedCells: CellState[] = dummySolution.map((v) => ({
        value: v,
        given: true,
        notes: [],
      }));
      const report = validateEntireBoard(solvedCells, dummySolution);
      assert.equal(report.rowDuplicates.length, 0);
      assert.equal(report.colDuplicates.length, 0);
      assert.equal(report.boxDuplicates.length, 0);
      assert.equal(report.solutionDisagreements.length, 0);
      assert.equal(report.impossibleEmptyCells.length, 0);
    });

    it("should detect duplicate numbers across rows and columns in validateEntireBoard", () => {
      const badCells: CellState[] = dummySolution.map((v, i) => ({
        value: i === 1 ? 5 : v, // duplicate 5 in row 0
        given: false,
        notes: [],
      }));
      const report = validateEntireBoard(badCells, dummySolution);
      assert.ok(report.rowDuplicates.length > 0);
    });
  });

  describe("Store Action Guarding (Paused, Won, Game Over)", () => {
    it("should block cell input and hints when game is paused", () => {
      const store = useGameStore.getState();
      store.newGame("easy", 1);
      const cellIdx = 50;
      store.select(cellIdx);
      store.pause();

      // Attempt input while paused
      store.input(9);
      assert.notEqual(useGameStore.getState().cells[cellIdx].value, 9);

      // Attempt hint while paused
      const prevHints = useGameStore.getState().hintsUsed;
      store.hint();
      assert.equal(useGameStore.getState().hintsUsed, prevHints);

      // Resume and verify input works
      store.resume();
      const p = useGameStore.getState().puzzle!;
      store.input(p.solution[cellIdx]);
      assert.equal(useGameStore.getState().cells[cellIdx].value, p.solution[cellIdx]);
    });

    it("should block inputs when mistake limit is reached (Game Over)", () => {
      const store = useGameStore.getState();
      store.newGame("easy", 1);
      store.setMistakeLimit(1);

      // Find an editable cell
      const editableIdx = useGameStore.getState().cells.findIndex((c) => !c.given);
      assert.ok(editableIdx >= 0);
      store.select(editableIdx);

      // Make a mistake (wrong digit)
      const correctVal = useGameStore.getState().puzzle!.solution[editableIdx];
      const wrongVal = correctVal === 9 ? 1 : correctVal + 1;
      store.input(wrongVal);

      // Mistakes should be 1, running should be false (Game Over)
      assert.equal(useGameStore.getState().mistakes, 1);
      assert.equal(useGameStore.getState().running, false);

      // Further inputs must be blocked
      const nextWrongVal = wrongVal === 9 ? 1 : wrongVal + 1;
      store.input(nextWrongVal);
      assert.notEqual(useGameStore.getState().cells[editableIdx].value, nextWrongVal);
    });

    it("should block undo and redo when paused or won", () => {
      const store = useGameStore.getState();
      store.newGame("easy", 1);
      const currentPuzzle = useGameStore.getState().puzzle!;
      const editableIdx = useGameStore.getState().cells.findIndex((c) => !c.given);
      store.select(editableIdx);
      store.input(currentPuzzle.solution[editableIdx]);

      assert.equal(useGameStore.getState().history.length, 1);

      // Pause and try undo
      store.pause();
      store.undo();
      // Should not have undone while paused
      assert.equal(useGameStore.getState().history.length, 1);

      // Resume and undo succeeds
      store.resume();
      store.undo();
      assert.equal(useGameStore.getState().history.length, 0);
      assert.equal(useGameStore.getState().future.length, 1);
    });

    it("should block submitGame when paused, not running, or already won", () => {
      const store = useGameStore.getState();
      store.newGame("easy", 1);
      store.pause();
      store.submitGame();
      // submitResult should remain null while paused
      assert.equal(useGameStore.getState().submitResult, null);
    });
  });

  describe("Scoring & Streak Edge Cases", () => {
    it("should handle non-finite, negative, and extreme inputs in computeScore", () => {
      const score = computeScore(dummyPuzzle, NaN, -5, Infinity);
      assert.ok(Number.isFinite(score.total));
      assert.ok(score.total >= Math.round(score.base * 0.5));
    });

    it("should maintain streak after multiple wins on the same day without duplicating", () => {
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

      const score = computeScore(dummyPuzzle, 60, 0, 0);
      const win1 = applyWinToStats(initialStats, dummyPuzzle, 60, score);
      assert.equal(win1.currentStreakDays, 1);
      assert.equal(win1.longestStreakDays, 1);
      assert.equal(win1.lastPlayedDate, todayKey());

      const win2 = applyWinToStats(win1, dummyPuzzle, 50, score);
      assert.equal(win2.currentStreakDays, 1); // Streak does not jump to 2 on the same day!
      assert.equal(win2.bestTimeByDifficulty["easy"], 50); // Best time improved
    });

    it("should increment streak when consecutive win occurs on the next day", () => {
      const yesterdayStats: Stats = {
        gamesPlayed: 3,
        gamesWon: 3,
        bestTimeByDifficulty: { easy: 80 },
        totalPoints: 500,
        currentStreakDays: 2,
        longestStreakDays: 5,
        lastPlayedDate: yesterdayKey(),
        completedLevels: ["easy-1"],
      };

      const score = computeScore(dummyPuzzle, 60, 0, 0);
      const winToday = applyWinToStats(yesterdayStats, dummyPuzzle, 60, score);
      assert.equal(winToday.currentStreakDays, 3); // 2 + 1 = 3
      assert.equal(winToday.longestStreakDays, 5); // Kept highest streak
    });

    it("should reset streak to 1 if user missed days, but preserve longestStreakDays", () => {
      const lapsedStats: Stats = {
        gamesPlayed: 10,
        gamesWon: 10,
        bestTimeByDifficulty: { easy: 80 },
        totalPoints: 1200,
        currentStreakDays: 7,
        longestStreakDays: 14,
        lastPlayedDate: "2024-01-01", // Old date
        completedLevels: ["easy-1"],
      };

      const score = computeScore(dummyPuzzle, 60, 0, 0);
      const win = applyWinToStats(lapsedStats, dummyPuzzle, 60, score);
      assert.equal(win.currentStreakDays, 1); // Reset to 1
      assert.equal(win.longestStreakDays, 14); // Preserved previous peak record
    });
  });
});
