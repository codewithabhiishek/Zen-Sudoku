import type { Grid } from "./types";

// Precomputed peers & units for speed.
export const ROWS: number[][] = Array.from({ length: 9 }, (_, r) =>
  Array.from({ length: 9 }, (_, c) => r * 9 + c),
);
export const COLS: number[][] = Array.from({ length: 9 }, (_, c) =>
  Array.from({ length: 9 }, (_, r) => r * 9 + c),
);
export const BOXES: number[][] = Array.from({ length: 9 }, (_, b) => {
  const br = Math.floor(b / 3) * 3;
  const bc = (b % 3) * 3;
  const out: number[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out.push((br + r) * 9 + (bc + c));
  return out;
});

export const UNITS: number[][][] = Array.from({ length: 81 }, (_, i) => {
  const r = Math.floor(i / 9);
  const c = i % 9;
  const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
  return [ROWS[r], COLS[c], BOXES[b]];
});

export const PEERS: number[][] = Array.from({ length: 81 }, (_, i) => {
  const set = new Set<number>();
  for (const u of UNITS[i]) for (const j of u) if (j !== i) set.add(j);
  return [...set];
});

export function cloneGrid(g: Grid): Grid {
  return g.slice();
}

export function emptyGrid(): Grid {
  return new Array(81).fill(0);
}

export function isValidPlacement(g: Grid, idx: number, val: number): boolean {
  for (const p of PEERS[idx]) if (g[p] === val) return false;
  return true;
}

/**
 * Count solutions with early termination at `limit`.
 * Uses MRV (minimum remaining values) selection and bitmask candidates.
 */
export function countSolutions(grid: Grid, limit = 2): number {
  const g = grid.slice();
  // build candidate bitmasks per cell (bit1..bit9)
  const cand = new Uint16Array(81);
  const FULL = 0b1111111110; // bits 1..9

  for (let i = 0; i < 81; i++) {
    if (g[i] !== 0) continue;
    let mask = FULL;
    for (const p of PEERS[i]) {
      if (g[p]) mask &= ~(1 << g[p]);
    }
    cand[i] = mask;
    if (mask === 0) return 0;
  }

  let count = 0;

  function solve(): boolean {
    // find MRV empty cell
    let bestIdx = -1;
    let bestCount = 10;
    for (let i = 0; i < 81; i++) {
      if (g[i] !== 0) continue;
      const m = cand[i];
      const c = popcount(m);
      if (c < bestCount) {
        bestCount = c;
        bestIdx = i;
        if (c <= 1) break;
      }
    }
    if (bestIdx === -1) {
      count++;
      return count >= limit;
    }
    const mask = cand[bestIdx];
    // snapshot peers we'll modify
    const peers = PEERS[bestIdx];
    for (let v = 1; v <= 9; v++) {
      if (!(mask & (1 << v))) continue;
      g[bestIdx] = v;
      const bit = 1 << v;
      const changed: number[] = [];
      let dead = false;
      for (const p of peers) {
        if (g[p] === 0 && cand[p] & bit) {
          cand[p] &= ~bit;
          changed.push(p);
          if (cand[p] === 0) {
            dead = true;
          }
        }
      }
      if (!dead) {
        if (solve()) {
          // undo before return
          g[bestIdx] = 0;
          for (const p of changed) cand[p] |= bit;
          return true;
        }
      }
      g[bestIdx] = 0;
      for (const p of changed) cand[p] |= bit;
    }
    return false;
  }

  solve();
  return count;
}

export function solve(grid: Grid): Grid | null {
  const g = grid.slice();
  const FULL = 0b1111111110;
  const cand = new Uint16Array(81);
  for (let i = 0; i < 81; i++) {
    if (g[i] !== 0) continue;
    let mask = FULL;
    for (const p of PEERS[i]) if (g[p]) mask &= ~(1 << g[p]);
    cand[i] = mask;
    if (mask === 0) return null;
  }
  function rec(): boolean {
    let bestIdx = -1;
    let bestCount = 10;
    for (let i = 0; i < 81; i++) {
      if (g[i] !== 0) continue;
      const c = popcount(cand[i]);
      if (c < bestCount) {
        bestCount = c;
        bestIdx = i;
        if (c <= 1) break;
      }
    }
    if (bestIdx === -1) return true;
    const mask = cand[bestIdx];
    const peers = PEERS[bestIdx];
    for (let v = 1; v <= 9; v++) {
      if (!(mask & (1 << v))) continue;
      g[bestIdx] = v;
      const bit = 1 << v;
      const changed: number[] = [];
      let dead = false;
      for (const p of peers) {
        if (g[p] === 0 && cand[p] & bit) {
          cand[p] &= ~bit;
          changed.push(p);
          if (cand[p] === 0) dead = true;
        }
      }
      if (!dead && rec()) return true;
      g[bestIdx] = 0;
      for (const p of changed) cand[p] |= bit;
    }
    return false;
  }
  return rec() ? g : null;
}

export function popcount(m: number): number {
  m = m - ((m >> 1) & 0x55555555);
  m = (m & 0x33333333) + ((m >> 2) & 0x33333333);
  return (((m + (m >> 4)) & 0x0f0f0f0f) * 0x01010101) >> 24;
}

export function isComplete(g: Grid): boolean {
  for (let i = 0; i < 81; i++) if (g[i] === 0) return false;
  return true;
}

export function findConflicts(g: Grid): Set<number> {
  const conflicts = new Set<number>();
  for (const unit of [...ROWS, ...COLS, ...BOXES]) {
    const seen = new Map<number, number[]>();
    for (const i of unit) {
      const v = g[i];
      if (!v) continue;
      const arr = seen.get(v) ?? [];
      arr.push(i);
      seen.set(v, arr);
    }
    for (const arr of seen.values()) {
      if (arr.length > 1) for (const i of arr) conflicts.add(i);
    }
  }
  return conflicts;
}
