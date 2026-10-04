import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generatePuzzle } from "../../src/lib/sudoku/generator.ts";
import {
  findConflicts,
  countSolutions,
  isComplete,
} from "../../src/lib/sudoku/solver.ts";
import { rateDifficulty } from "../../src/lib/sudoku/techniques.ts";
import type { Difficulty } from "../../src/lib/sudoku/types.ts";

describe("Campaign Levels Verification (All 40 Levels)", () => {
  const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert"];
  const seenPuzzles = new Set<string>();
  const seenSolutions = new Set<string>();

  for (const diff of difficulties) {
    describe(`${diff.toUpperCase()} Difficulty (Levels 1 to 10)`, () => {
      for (let level = 1; level <= 10; level++) {
        it(`Level ${level}: is mathematically valid, unique solution, and no duplicates`, () => {
          const seedStr = `zen-${diff}-lvl-${level}`;
          const puzzleObj = generatePuzzle(diff, seedStr, level);

          // 1. Grid structure
          assert.equal(
            puzzleObj.puzzle.length,
            81,
            `Puzzle length must be 81 (got ${puzzleObj.puzzle.length})`,
          );
          assert.equal(
            puzzleObj.solution.length,
            81,
            `Solution length must be 81 (got ${puzzleObj.solution.length})`,
          );

          // 2. Solution correctness (no empty cells, no row/col/box duplicates)
          assert.equal(
            isComplete(puzzleObj.solution),
            true,
            "Solution must be completely filled without zeros",
          );
          const solutionConflicts = findConflicts(puzzleObj.solution);
          assert.equal(
            solutionConflicts.size,
            0,
            `Solution has conflicting cells: ${Array.from(solutionConflicts).join(", ")}`,
          );

          // 3. Clues validity (all given numbers strictly match solution)
          const clueIndices: number[] = [];
          for (let i = 0; i < 81; i++) {
            const val = puzzleObj.puzzle[i];
            if (val !== 0) {
              clueIndices.push(i);
              assert.equal(
                val,
                puzzleObj.solution[i],
                `Cell ${i} clue (${val}) does not match solution (${puzzleObj.solution[i]})`,
              );
            }
          }
          assert.equal(
            clueIndices.length,
            puzzleObj.clueCount,
            "puzzle.clueCount must equal number of non-zero cells in puzzle",
          );

          // 4. Initial puzzle has 0 conflicts
          const puzzleConflicts = findConflicts(puzzleObj.puzzle);
          assert.equal(
            puzzleConflicts.size,
            0,
            `Initial puzzle has conflicting clues: ${Array.from(puzzleConflicts).join(", ")}`,
          );

          // 5. Uniqueness of solution (EXACTLY 1 solution)
          const solCount = countSolutions(puzzleObj.puzzle, 2);
          assert.equal(
            solCount,
            1,
            `Puzzle must have strictly 1 unique solution (got ${solCount})`,
          );

          // 6. Difficulty bounds
          assert.ok(
            puzzleObj.clueCount >= 17 && puzzleObj.clueCount <= 55,
            `Clue count ${puzzleObj.clueCount} out of reasonable range`,
          );

          // 7. Check for duplicate puzzles
          const puzzleStr = puzzleObj.puzzle.join(",");
          assert.equal(
            seenPuzzles.has(puzzleStr),
            false,
            `Duplicate puzzle board detected at ${diff} level ${level}!`,
          );
          seenPuzzles.add(puzzleStr);

          // 8. Check for duplicate full solutions
          const solutionStr = puzzleObj.solution.join(",");
          assert.equal(
            seenSolutions.has(solutionStr),
            false,
            `Duplicate solution grid detected at ${diff} level ${level}!`,
          );
          seenSolutions.add(solutionStr);

          // 9. Logical solvability rating check
          const rating = rateDifficulty(puzzleObj.puzzle);
          assert.ok(
            ["easy", "medium", "hard", "expert"].includes(rating.difficulty),
            `Puzzle at ${diff} level ${level} should have valid difficulty rating`,
          );
          assert.ok(
            rating.hardest,
            `Puzzle at ${diff} level ${level} should have a valid hardest technique`,
          );

          // 10. Deterministic regeneration check (re-running with same seed produces identical board)
          const rerun = generatePuzzle(diff, seedStr, level);
          assert.deepEqual(
            rerun.puzzle,
            puzzleObj.puzzle,
            `Regeneration must be 100% deterministic for level ${level}`,
          );
          assert.deepEqual(
            rerun.solution,
            puzzleObj.solution,
            `Regeneration solution must be 100% deterministic for level ${level}`,
          );
        });
      }
    });
  }

  it("should verify all 40 campaign levels are distinct", () => {
    assert.equal(seenPuzzles.size, 40, "Expected 40 unique puzzles");
    assert.equal(seenSolutions.size, 40, "Expected 40 unique solutions");
  });

  describe("Dynamic / Quick Play Puzzles", () => {
    it("should generate valid, unique puzzles dynamically without seeds", () => {
      const dynamicSeen = new Set<string>();
      for (const diff of difficulties) {
        const dynamicPuzzle = generatePuzzle(diff);
        assert.equal(dynamicPuzzle.puzzle.length, 81);
        assert.equal(dynamicPuzzle.solution.length, 81);
        assert.equal(isComplete(dynamicPuzzle.solution), true);
        assert.equal(findConflicts(dynamicPuzzle.solution).size, 0);
        assert.equal(findConflicts(dynamicPuzzle.puzzle).size, 0);
        assert.equal(countSolutions(dynamicPuzzle.puzzle, 2), 1);

        const key = dynamicPuzzle.puzzle.join(",");
        assert.equal(dynamicSeen.has(key), false);
        dynamicSeen.add(key);
      }
    });
  });
});
