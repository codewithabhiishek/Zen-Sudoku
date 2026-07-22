import { PEERS, ROWS, COLS, BOXES } from "./solver";
import type { Grid } from "./types";

export interface MoveExplanation {
  isCorrect: boolean;
  title: string;
  reason: string;
  details: string[];
}

export function explainMove(
  cells: { value: number; given: boolean }[],
  solution: Grid,
  idx: number,
  placedValue: number,
): MoveExplanation {
  const r = Math.floor(idx / 9);
  const c = idx % 9;
  const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);

  const rowName = `Row ${r + 1}`;
  const colName = `Column ${c + 1}`;
  const boxName = `Box ${b + 1}`;

  // 1. Check Row conflicts
  const rowConflict = ROWS[r].find((p) => p !== idx && cells[p].value === placedValue);
  // 2. Check Col conflicts
  const colConflict = COLS[c].find((p) => p !== idx && cells[p].value === placedValue);
  // 3. Check Box conflicts
  const boxConflict = BOXES[b].find((p) => p !== idx && cells[p].value === placedValue);

  if (rowConflict != null || colConflict != null || boxConflict != null) {
    const details: string[] = [];
    if (rowConflict != null) {
      const conflictCol = (rowConflict % 9) + 1;
      details.push(`Digit ${placedValue} is already in ${rowName} (Column ${conflictCol}).`);
    }
    if (colConflict != null) {
      const conflictRow = Math.floor(colConflict / 9) + 1;
      details.push(`Digit ${placedValue} is already in ${colName} (Row ${conflictRow}).`);
    }
    if (boxConflict != null) {
      const conflictRow = Math.floor(boxConflict / 9) + 1;
      const conflictCol = (boxConflict % 9) + 1;
      details.push(`Digit ${placedValue} is already in ${boxName} (Row ${conflictRow}, Column ${conflictCol}).`);
    }

    return {
      isCorrect: false,
      title: `Rule Violation: Duplicate ${placedValue}`,
      reason: `The number ${placedValue} violates standard Sudoku rules because it duplicates another ${placedValue} in the same unit.`,
      details,
    };
  }

  // 4. Solution check
  const correctVal = solution[idx];
  if (placedValue !== correctVal) {
    return {
      isCorrect: false,
      title: `Incorrect Digit: ${placedValue}`,
      reason: `Digit ${placedValue} does not lead to a valid overall solution for this puzzle.`,
      details: [
        `Digit ${placedValue} has no rule conflicts with existing numbers, but it blocks the true mathematical solution for this cell.`,
      ],
    };
  }

  // 5. Correct move calculation explanation
  const remainingCandidates: number[] = [];
  const usedNumbers = new Set<number>();
  for (const p of PEERS[idx]) {
    if (cells[p].value !== 0) usedNumbers.add(cells[p].value);
  }
  for (let v = 1; v <= 9; v++) {
    if (!usedNumbers.has(v)) remainingCandidates.push(v);
  }

  const details: string[] = [
    `${rowName}, ${colName}, and ${boxName} already contain: [${Array.from(usedNumbers).sort((a, b) => a - b).join(", ")}].`,
  ];

  if (remainingCandidates.length === 1) {
    details.push(`Naked Single: ${placedValue} is the ONLY number that can mathematically fit in this cell!`);
  } else {
    details.push(`Valid Candidates for this cell: [${remainingCandidates.join(", ")}]. ${placedValue} is the unique true solution!`);
  }

  return {
    isCorrect: true,
    title: `Great Move! ${placedValue} is Correct`,
    reason: `Digit ${placedValue} satisfies all row, column, and box constraints.`,
    details,
  };
}
