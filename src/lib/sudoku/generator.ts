import type { Difficulty, Grid, Puzzle } from "./types";
import { BOXES, countSolutions, emptyGrid, PEERS, popcount } from "./solver";
import { rateDifficulty } from "./techniques";

/** Seeded PRNG (mulberry32) so daily challenges / replays are reproducible. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Generate a fully solved, valid 9×9 grid using randomized backtracking. */
export function generateSolved(rand: () => number): Grid {
  const g = emptyGrid();
  // Fill diagonal 3x3 boxes first (independent → fast).
  for (const b of [0, 4, 8]) {
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rand);
    BOXES[b].forEach((idx, k) => (g[idx] = nums[k]));
  }
  fill(g, rand);
  return g;
}

function fill(g: Grid, rand: () => number): boolean {
  let idx = -1;
  for (let i = 0; i < 81; i++) if (g[i] === 0) { idx = i; break; }
  if (idx === -1) return true;
  const used = new Set<number>();
  for (const p of PEERS[idx]) if (g[p]) used.add(g[p]);
  const candidates = shuffle(
    [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((v) => !used.has(v)),
    rand,
  );
  for (const v of candidates) {
    g[idx] = v;
    if (fill(g, rand)) return true;
    g[idx] = 0;
  }
  return false;
}

/**
 * Generate a puzzle at the requested difficulty.
 * Guarantees a UNIQUE solution — never returns a puzzle with 0 or 2+ solutions.
 * Rates by the hardest logical technique required; re-tries on mismatch.
 */
export function generatePuzzle(difficulty: Difficulty, seed?: string): Puzzle {
  const seedNum = seed ? hashSeed(seed) : Math.floor(Math.random() * 0xffffffff);
  const rand = rng(seedNum);
  const targetClues = clueTargetFor(difficulty);

  // Try up to N times to hit desired difficulty.
  const MAX_ATTEMPTS = 12;
  let best: Puzzle | null = null;
  let bestDelta = Infinity;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const solution = generateSolved(rand);
    const puzzle = digHoles(solution, rand, targetClues.floor);
    const clueCount = puzzle.filter((v) => v !== 0).length;
    const rating = rateDifficulty(puzzle);
    const p: Puzzle = {
      puzzle,
      solution,
      difficulty: rating.difficulty,
      seed: `${seedNum}-${attempt}`,
      clueCount,
    };
    if (rating.difficulty === difficulty) return p;
    const delta = Math.abs(rankOf(rating.difficulty) - rankOf(difficulty));
    if (delta < bestDelta) { bestDelta = delta; best = p; }
  }
  return best!;
}

function rankOf(d: Difficulty): number {
  return { easy: 1, medium: 2, hard: 3, expert: 4 }[d];
}

function clueTargetFor(d: Difficulty): { floor: number } {
  return { easy: { floor: 38 }, medium: { floor: 32 }, hard: { floor: 28 }, expert: { floor: 24 } }[d];
}

/**
 * Remove digits one at a time in random order.
 * After each removal, verify the puzzle still has exactly ONE solution.
 * If not, restore and skip. This is the single most important correctness check.
 */
function digHoles(solution: Grid, rand: () => number, minClues: number): Grid {
  const puzzle = solution.slice();
  // symmetric removal (180° rotation) for prettier puzzles
  const order = shuffle(
    Array.from({ length: 81 }, (_, i) => i),
    rand,
  );
  let clues = 81;
  for (const idx of order) {
    if (clues <= minClues) break;
    const sym = 80 - idx;
    if (puzzle[idx] === 0) continue;
    const savedA = puzzle[idx];
    const savedB = puzzle[sym];
    puzzle[idx] = 0;
    let removed = 1;
    if (sym !== idx && puzzle[sym] !== 0) {
      puzzle[sym] = 0;
      removed = 2;
    }
    // MUST have unique solution
    const count = countSolutions(puzzle, 2);
    if (count !== 1) {
      puzzle[idx] = savedA;
      puzzle[sym] = savedB;
    } else {
      clues -= removed;
    }
  }
  return puzzle;
}

function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Re-exports for convenience
export { popcount, countSolutions };
