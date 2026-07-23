import { generatePuzzle } from "./lib/sudoku/generator";
import { validateEntireBoard, CellState } from "./store/gameStore";
import type { Difficulty } from "./lib/sudoku/types";

function run100PuzzlesTest() {
  console.log("=================================================");
  console.log("    RUNNING 100 PUZZLES PERFECT REPLAY TEST");
  console.log("=================================================\n");

  const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert"];
  let totalPuzzlesTested = 0;
  let totalMovesExecuted = 0;
  let failures = 0;

  const startTime = Date.now();

  for (let i = 1; i <= 100; i++) {
    const diff = difficulties[(i - 1) % difficulties.length];
    const seed = `perfect-replay-seed-${i}`;
    const puzzle = generatePuzzle(diff, seed, ((i - 1) % 10) + 1);
    const solution = puzzle.solution;
    const cells: CellState[] = puzzle.puzzle.map((v) => ({
      value: v,
      given: v !== 0,
      notes: [],
    }));

    totalPuzzlesTested++;

    const emptyIndices = cells
      .map((c, idx) => (c.value === 0 ? idx : -1))
      .filter((idx) => idx !== -1);

    let moveNum = 0;
    for (const idx of emptyIndices) {
      moveNum++;
      totalMovesExecuted++;

      const correctVal = solution[idx];
      cells[idx].value = correctVal; // Fill ONLY the correct solution value

      const report = validateEntireBoard(cells, solution);

      // Assertions
      if (
        report.impossibleEmptyCells.length > 0 ||
        report.rowDuplicates.length > 0 ||
        report.colDuplicates.length > 0 ||
        report.boxDuplicates.length > 0 ||
        report.solutionDisagreements.length > 0
      ) {
        failures++;
        console.error(`\n❌ ASSERTION FAILED at Puzzle ${i} (${diff}, Level ${((i - 1) % 10) + 1})`);
        console.error(`Puzzle Seed: ${seed}`);
        console.error(`Move Number: ${moveNum} (Cell index ${idx}, Placed ${correctVal})`);
        console.error(`Report:`, JSON.stringify(report, null, 2));
        console.error(`Board State:`);
        for (let r = 0; r < 9; r++) {
          console.error(cells.slice(r * 9, r * 9 + 9).map((c) => c.value || ".").join(" "));
        }
        process.exit(1);
      }
    }
  }

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("=================================================");
  console.log("              TEST RESULTS SUMMARY");
  console.log("=================================================");
  console.log(`Total Puzzles Tested: ${totalPuzzlesTested} / 100`);
  console.log(`Total Moves Executed: ${totalMovesExecuted}`);
  console.log(`Assertion Failures:   ${failures}`);
  console.log(`Elapsed Time:         ${elapsedSec}s`);
  console.log(`\n✅ PERFECT SCORE: 100/100 Puzzles passed with ZERO impossible cells or contradictions when playing correct moves!`);
  console.log("=================================================\n");
}

run100PuzzlesTest();
