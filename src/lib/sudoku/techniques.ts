import type { Difficulty, Grid } from "./types";
import { BOXES, COLS, PEERS, ROWS, popcount } from "./solver";

/**
 * Logic-solver used to *rate* puzzle difficulty by the hardest technique
 * required. If no technique advances the state and the puzzle isn't solved,
 * the rater falls back to backtracking → classified as "expert".
 */

type TechniqueId =
  | "naked_single"
  | "hidden_single"
  | "naked_pair"
  | "pointing_pair"
  | "box_line"
  | "hidden_pair"
  | "x_wing";

const RANK: Record<TechniqueId, number> = {
  naked_single: 1,
  hidden_single: 2,
  naked_pair: 3,
  pointing_pair: 3,
  box_line: 3,
  hidden_pair: 4,
  x_wing: 5,
};

const FULL = 0b1111111110;

function buildCandidates(g: Grid): Uint16Array {
  const cand = new Uint16Array(81);
  for (let i = 0; i < 81; i++) {
    if (g[i] !== 0) continue;
    let m = FULL;
    for (const p of PEERS[i]) if (g[p]) m &= ~(1 << g[p]);
    cand[i] = m;
  }
  return cand;
}

const ALL_UNITS = [...ROWS, ...COLS, ...BOXES];

export interface RateResult {
  difficulty: Difficulty;
  hardest: TechniqueId | "backtrack";
}

export function rateDifficulty(puzzle: Grid): RateResult {
  const g = puzzle.slice();
  const cand = buildCandidates(g);
  let hardest = 0;
  let hardestId: TechniqueId = "naked_single";

  const bump = (id: TechniqueId) => {
    if (RANK[id] > hardest) {
      hardest = RANK[id];
      hardestId = id;
    }
  };

  while (true) {
    let solved = true;
    for (let i = 0; i < 81; i++) if (g[i] === 0) { solved = false; break; }
    if (solved) break;

    if (nakedSingle(g, cand)) { bump("naked_single"); continue; }
    if (hiddenSingle(g, cand)) { bump("hidden_single"); continue; }
    if (nakedPair(cand)) { bump("naked_pair"); continue; }
    if (pointingPair(cand)) { bump("pointing_pair"); continue; }
    if (boxLine(cand)) { bump("box_line"); continue; }
    if (hiddenPair(cand)) { bump("hidden_pair"); continue; }
    if (xWing(cand)) { bump("x_wing"); continue; }

    return { difficulty: "expert", hardest: "backtrack" };
  }

  void hardest;
  const d: Difficulty =
    hardestId === "naked_single" || hardestId === "hidden_single" ? "easy"
    : hardestId === "naked_pair" || hardestId === "pointing_pair" || hardestId === "box_line" ? "medium"
    : hardestId === "hidden_pair" ? "hard"
    : "expert";

  return { difficulty: d, hardest: hardestId };
}

// --- Techniques ---

function nakedSingle(g: Grid, cand: Uint16Array): boolean {
  let progressed = false;
  for (let i = 0; i < 81; i++) {
    if (g[i] !== 0) continue;
    const m = cand[i];
    if (popcount(m) === 1) {
      const v = lowestBit(m);
      place(g, cand, i, v);
      progressed = true;
    }
  }
  return progressed;
}

function hiddenSingle(g: Grid, cand: Uint16Array): boolean {
  let progressed = false;
  for (const unit of ALL_UNITS) {
    for (let v = 1; v <= 9; v++) {
      const bit = 1 << v;
      let found = -1;
      let count = 0;
      for (const i of unit) {
        if (g[i] === v) { count = -1; break; }
        if (g[i] === 0 && cand[i] & bit) { found = i; count++; if (count > 1) break; }
      }
      if (count === 1 && found !== -1) {
        place(g, cand, found, v);
        progressed = true;
      }
    }
  }
  return progressed;
}

function nakedPair(cand: Uint16Array): boolean {
  let progressed = false;
  for (const unit of ALL_UNITS) {
    const empties = unit.filter((i) => cand[i] !== 0 && popcount(cand[i]) === 2);
    for (let a = 0; a < empties.length; a++) {
      for (let b = a + 1; b < empties.length; b++) {
        if (cand[empties[a]] === cand[empties[b]]) {
          const mask = cand[empties[a]];
          for (const i of unit) {
            if (i === empties[a] || i === empties[b]) continue;
            if (cand[i] & mask) {
              cand[i] &= ~mask;
              progressed = true;
            }
          }
        }
      }
    }
  }
  return progressed;
}

function hiddenPair(cand: Uint16Array): boolean {
  let progressed = false;
  for (const unit of ALL_UNITS) {
    // for each pair of digits, find cells they can go in
    for (let v1 = 1; v1 <= 9; v1++) {
      for (let v2 = v1 + 1; v2 <= 9; v2++) {
        const b1 = 1 << v1, b2 = 1 << v2;
        const cells: number[] = [];
        let ok = true;
        for (const i of unit) {
          const hasV1 = cand[i] & b1;
          const hasV2 = cand[i] & b2;
          if (hasV1 || hasV2) cells.push(i);
          if (cells.length > 2) { ok = false; break; }
        }
        if (!ok || cells.length !== 2) continue;
        // both digits confined to these 2 cells
        const has1 = cells.some((i) => cand[i] & b1);
        const has2 = cells.some((i) => cand[i] & b2);
        if (!has1 || !has2) continue;
        const newMask = b1 | b2;
        for (const i of cells) {
          if (cand[i] & ~newMask) {
            cand[i] &= newMask;
            progressed = true;
          }
        }
      }
    }
  }
  return progressed;
}

function pointingPair(cand: Uint16Array): boolean {
  let progressed = false;
  for (let b = 0; b < 9; b++) {
    const box = BOXES[b];
    for (let v = 1; v <= 9; v++) {
      const bit = 1 << v;
      const cells = box.filter((i) => cand[i] & bit);
      if (cells.length < 2 || cells.length > 3) continue;
      const rows = new Set(cells.map((i) => Math.floor(i / 9)));
      const cols = new Set(cells.map((i) => i % 9));
      if (rows.size === 1) {
        const r = [...rows][0];
        for (const i of ROWS[r]) {
          if (box.includes(i)) continue;
          if (cand[i] & bit) { cand[i] &= ~bit; progressed = true; }
        }
      }
      if (cols.size === 1) {
        const c = [...cols][0];
        for (const i of COLS[c]) {
          if (box.includes(i)) continue;
          if (cand[i] & bit) { cand[i] &= ~bit; progressed = true; }
        }
      }
    }
  }
  return progressed;
}

function boxLine(cand: Uint16Array): boolean {
  let progressed = false;
  const lines = [...ROWS, ...COLS];
  for (const line of lines) {
    for (let v = 1; v <= 9; v++) {
      const bit = 1 << v;
      const cells = line.filter((i) => cand[i] & bit);
      if (cells.length < 2 || cells.length > 3) continue;
      const boxes = new Set(
        cells.map((i) => Math.floor(Math.floor(i / 9) / 3) * 3 + Math.floor((i % 9) / 3)),
      );
      if (boxes.size === 1) {
        const b = [...boxes][0];
        for (const i of BOXES[b]) {
          if (line.includes(i)) continue;
          if (cand[i] & bit) { cand[i] &= ~bit; progressed = true; }
        }
      }
    }
  }
  return progressed;
}

function xWing(cand: Uint16Array): boolean {
  let progressed = false;
  for (let v = 1; v <= 9; v++) {
    const bit = 1 << v;
    // row-based
    const rowCols: number[][] = [];
    for (let r = 0; r < 9; r++) {
      const cs: number[] = [];
      for (let c = 0; c < 9; c++) if (cand[r * 9 + c] & bit) cs.push(c);
      rowCols.push(cs);
    }
    for (let r1 = 0; r1 < 9; r1++) {
      if (rowCols[r1].length !== 2) continue;
      for (let r2 = r1 + 1; r2 < 9; r2++) {
        if (rowCols[r2].length !== 2) continue;
        if (rowCols[r1][0] === rowCols[r2][0] && rowCols[r1][1] === rowCols[r2][1]) {
          const [c1, c2] = rowCols[r1];
          for (let r = 0; r < 9; r++) {
            if (r === r1 || r === r2) continue;
            for (const c of [c1, c2]) {
              const i = r * 9 + c;
              if (cand[i] & bit) { cand[i] &= ~bit; progressed = true; }
            }
          }
        }
      }
    }
    // col-based
    const colRows: number[][] = [];
    for (let c = 0; c < 9; c++) {
      const rs: number[] = [];
      for (let r = 0; r < 9; r++) if (cand[r * 9 + c] & bit) rs.push(r);
      colRows.push(rs);
    }
    for (let c1 = 0; c1 < 9; c1++) {
      if (colRows[c1].length !== 2) continue;
      for (let c2 = c1 + 1; c2 < 9; c2++) {
        if (colRows[c2].length !== 2) continue;
        if (colRows[c1][0] === colRows[c2][0] && colRows[c1][1] === colRows[c2][1]) {
          const [r1, r2] = colRows[c1];
          for (let c = 0; c < 9; c++) {
            if (c === c1 || c === c2) continue;
            for (const r of [r1, r2]) {
              const i = r * 9 + c;
              if (cand[i] & bit) { cand[i] &= ~bit; progressed = true; }
            }
          }
        }
      }
    }
  }
  return progressed;
}

function place(g: Grid, cand: Uint16Array, idx: number, v: number) {
  g[idx] = v;
  cand[idx] = 0;
  const bit = 1 << v;
  for (const p of PEERS[idx]) cand[p] &= ~bit;
}

function lowestBit(m: number): number {
  for (let v = 1; v <= 9; v++) if (m & (1 << v)) return v;
  return 0;
}

/** Suggest the "most teachable" empty cell for a hint: prefer naked/hidden singles. */
export function pickHintCell(puzzle: Grid, solution: Grid): number {
  const cand = buildCandidates(puzzle);
  // naked single first
  for (let i = 0; i < 81; i++) {
    if (puzzle[i] === 0 && popcount(cand[i]) === 1) return i;
  }
  // hidden single
  for (const unit of ALL_UNITS) {
    for (let v = 1; v <= 9; v++) {
      const bit = 1 << v;
      let found = -1;
      let count = 0;
      for (const i of unit) {
        if (puzzle[i] === v) { count = -1; break; }
        if (puzzle[i] === 0 && cand[i] & bit) { found = i; count++; }
      }
      if (count === 1) return found;
    }
  }
  // fallback: cell with fewest candidates
  let best = -1, bestCount = 10;
  for (let i = 0; i < 81; i++) {
    if (puzzle[i] !== 0) continue;
    const c = popcount(cand[i]);
    if (c < bestCount) { bestCount = c; best = i; }
  }
  if (best === -1) {
    for (let i = 0; i < 81; i++) if (puzzle[i] === 0) return i;
  }
  return best;
}
