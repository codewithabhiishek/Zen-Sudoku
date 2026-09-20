import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { rng, generateSolved, generatePuzzle } from "../../src/lib/sudoku/generator.ts";
import { findConflicts, countSolutions, isComplete } from "../../src/lib/sudoku/solver.ts";

describe("Sudoku Generator Engine", () => {
  it("should generate deterministic PRNG numbers from the same seed", () => {
    const rand1 = rng(12345);
    const rand2 = rng(12345);

    for (let i = 0; i < 10; i++) {
      assert.equal(rand1(), rand2());
    }
  });

  it("should generate a valid solved 9x9 grid with zero conflicts", () => {
    const rand = rng(99999);
    const solved = generateSolved(rand);

    assert.equal(solved.length, 81);
    assert.equal(isComplete(solved), true);

    const conflicts = findConflicts(solved);
    assert.equal(conflicts.size, 0);
  });

  it("should generate a puzzle with exactly 1 unique solution", () => {
    const puzzle = generatePuzzle("easy", "test-seed-42", 1);

    assert.equal(puzzle.puzzle.length, 81);
    assert.equal(puzzle.solution.length, 81);
    assert.ok(puzzle.clueCount >= 20 && puzzle.clueCount <= 50);

    // Single unique solution verification
    const solutions = countSolutions(puzzle.puzzle, 2);
    assert.equal(solutions, 1);
  });
});
