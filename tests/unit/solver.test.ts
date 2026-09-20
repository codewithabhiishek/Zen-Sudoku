import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isValidPlacement,
  countSolutions,
  findConflicts,
  popcount,
  emptyGrid,
  isComplete,
} from "../../src/lib/sudoku/solver.ts";

describe("Sudoku Solver Engine", () => {
  it("should detect valid and invalid cell placements against peers", () => {
    const grid = emptyGrid();
    grid[0] = 5; // Row 0, Col 0 is 5

    // Same row conflict
    assert.equal(isValidPlacement(grid, 1, 5), false);
    assert.equal(isValidPlacement(grid, 1, 4), true);

    // Same col conflict
    assert.equal(isValidPlacement(grid, 9, 5), false);
    assert.equal(isValidPlacement(grid, 9, 7), true);

    // Same box conflict
    assert.equal(isValidPlacement(grid, 10, 5), false);
  });

  it("should accurately count solutions and stop at limit", () => {
    const grid = emptyGrid();
    // Empty grid has many solutions, limit=2 should stop immediately at 2
    assert.equal(countSolutions(grid, 2), 2);

    // Impossible grid should have 0 solutions
    const impossible = emptyGrid();
    for (let i = 0; i < 9; i++) {
      impossible[i] = (i % 8) + 1; // causes multiple conflicts or dead ends
    }
    impossible[0] = 5;
    impossible[1] = 5;
    assert.equal(countSolutions(impossible, 2), 0);
  });

  it("should find row, column, and box conflicts accurately", () => {
    const grid = emptyGrid();
    grid[0] = 3;
    grid[1] = 3; // row 0 conflict
    grid[18] = 3; // col 0 conflict with grid[0]

    const conflicts = findConflicts(grid);
    assert.ok(conflicts.has(0));
    assert.ok(conflicts.has(1));
    assert.ok(conflicts.has(18));
    assert.equal(conflicts.has(2), false);
  });

  it("should calculate popcount correctly", () => {
    assert.equal(popcount(0), 0);
    assert.equal(popcount(0b1), 1);
    assert.equal(popcount(0b10101), 3);
    assert.equal(popcount(0b1111111110), 9);
  });

  it("should verify isComplete check", () => {
    const incomplete = emptyGrid();
    incomplete[0] = 1;
    assert.equal(isComplete(incomplete), false);

    const complete = new Array(81).fill(1);
    assert.equal(isComplete(complete), true);
  });
});
