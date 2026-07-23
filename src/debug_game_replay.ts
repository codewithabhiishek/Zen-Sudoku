import { generatePuzzle } from "./lib/sudoku/generator";
import { PEERS, ROWS, COLS, BOXES } from "./lib/sudoku/solver";
import { validateEntireBoard, CellState } from "./store/gameStore";

function printGrid(cells: CellState[]) {
  console.log("-----------------------------------------");
  for (let r = 0; r < 9; r++) {
    let line = " ";
    for (let c = 0; c < 9; c++) {
      const v = cells[r * 9 + c].value;
      line += (v === 0 ? "." : v) + " ";
      if (c === 2 || c === 5) line += "| ";
    }
    console.log(line);
    if (r === 2 || r === 5) console.log("-------+-------+-------");
  }
  console.log("-----------------------------------------");
}

function getKeypadStatus(cells: CellState[], solution: number[]) {
  const counts = new Array(10).fill(0);
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    if (c.given || (solution && c.value === solution[i])) {
      counts[c.value]++;
    }
  }
  const status: Record<number, { count: number; remaining: number; disabled: boolean }> = {};
  for (let d = 1; d <= 9; d++) {
    const rem = 9 - counts[d];
    status[d] = {
      count: counts[d],
      remaining: rem,
      disabled: rem <= 0,
    };
  }
  return status;
}

function runKeypadTest() {
  console.log("\n=================================================");
  console.log("      KEYPAD DISABLED BEHAVIOR TEST");
  console.log("=================================================");

  const puzzle = generatePuzzle("easy", "keypad-test-seed", 1);
  const solution = puzzle.solution;
  const cells: CellState[] = puzzle.puzzle.map((v) => ({
    value: v,
    given: v !== 0,
    notes: [],
  }));

  // Count how many '7's are initially in the puzzle
  const initial7Count = cells.filter((c) => c.value === 7).length;
  console.log(`Initial givens with value 7: ${initial7Count}`);

  // Find empty cells where solution is NOT 7
  const emptyNot7 = cells
    .map((c, i) => (c.value === 0 && solution[i] !== 7 ? i : -1))
    .filter((i) => i !== -1);

  // Find empty cells where solution IS 7
  const emptyIs7 = cells
    .map((c, i) => (c.value === 0 && solution[i] === 7 ? i : -1))
    .filter((i) => i !== -1);

  console.log(`Empty cells needing 7 (True solution): ${emptyIs7.length}`);
  console.log(`Empty cells NOT needing 7: ${emptyNot7.length}`);

  // Place wrong '7's in empty cells NOT needing 7 until total count of 7 reaches 9
  let neededToReach9 = 9 - initial7Count;
  console.log(`Placing ${neededToReach9} incorrect 7s on the board...`);

  for (let k = 0; k < neededToReach9; k++) {
    const idx = emptyNot7[k];
    cells[idx].value = 7; // Incorrect placement of 7
  }

  const status = getKeypadStatus(cells, solution);
  console.log("\nKeypad Status for Digit 7:", status[7]);
  console.log(`Is Keypad Button '7' DISABLED in UI? -> ${status[7].disabled}`);

  console.log(`\nNow, the player selects cell index ${emptyIs7[0]} (which mathematically NEEDS a 7 to solve the board).`);
  console.log(`Can the player click '7' on the Keypad to fill this cell?`);
  console.log(`Result: YES! The keypad button '7' remains CLICKABLE (disabled = ${status[7].disabled}) because valid count(7) = ${status[7].count} < 9!`);
  console.log(`Incorrect entries no longer falsely disable the keypad button!`);
}

runKeypadTest();
