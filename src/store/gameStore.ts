import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CellState, Difficulty, Grid, Puzzle } from "@/lib/sudoku/types";
export type { CellState };
import { findConflicts, PEERS, ROWS, COLS, BOXES } from "@/lib/sudoku/solver";
import { generatePuzzle } from "@/lib/sudoku/generator";
import { pickHintCell } from "@/lib/sudoku/techniques";
import { explainMove } from "@/lib/sudoku/explainer";
import { useSettingsStore } from "@/store/settingsStore";
import {
  trackGameStarted,
  trackGameCompleted,
  trackNewPuzzle,
  trackHintUsed,
  trackUndoUsed,
  trackNotesMode,
} from "@/lib/analytics";
import {
  playSelectSound,
  playCorrectSound,
  playErrorSound,
  playNotesSound,
  playEraseSound,
  playHintSound,
  playWinSound,
} from "@/lib/sudoku/audio";

export interface Move {
  idx: number;
  prev: CellState;
  next: CellState;
}

export interface ScoreBreakdown {
  base: number;
  timeBonus: number;
  mistakePenalty: number;
  hintPenalty: number;
  noMistakeBonus: number;
  noHintBonus: number;
  total: number;
}

export interface Stats {
  gamesPlayed: number;
  gamesWon: number;
  bestTimeByDifficulty: Partial<Record<Difficulty, number>>;
  totalPoints: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastPlayedDate: string | null;
  completedLevels: string[]; // e.g. ["easy-1", "easy-2", "medium-3"]
}

export interface SubmitResult {
  isWin: boolean;
  totalFilled: number;
  emptyCount: number;
  wrongCount: number;
}

interface GameState {
  puzzle: Puzzle | null;
  cells: CellState[];
  selected: number | null;
  explanation: import("@/lib/sudoku/explainer").MoveExplanation | null;
  submitResult: SubmitResult | null;
  notesMode: boolean;
  smartNotes: boolean;
  mistakeLimit: number | null; // null = no limit
  mistakes: number;
  hintsUsed: number;
  elapsedMs: number;
  running: boolean;
  paused: boolean;
  hideTimer: boolean;
  history: Move[];
  future: Move[];
  won: boolean;
  score: ScoreBreakdown | null;
  stats: Stats;

  // actions
  newGame: (difficulty: Difficulty, level?: number) => void;
  select: (idx: number | null) => void;
  clearExplanation: () => void;
  explainCurrent: () => void;
  submitGame: () => void;
  clearSubmitResult: () => void;
  flashIdx: number | null;        // index of cell currently showing error flash
  clearFlash: () => void;
  move: (dr: number, dc: number) => void;
  input: (value: number) => void;
  clear: () => void;
  toggleNotes: () => void;
  toggleSmartNotes: () => void;
  setMistakeLimit: (n: number | null) => void;
  toggleHideTimer: () => void;
  hint: () => void;
  check: () => number; // returns count of wrong cells
  undo: () => void;
  redo: () => void;
  pause: () => void;
  resume: () => void;
  tick: (dtMs: number) => void;
  reset: () => void;
}

function initCells(puzzle: Grid): CellState[] {
  return puzzle.map<CellState>((v) => ({ value: v, given: v !== 0, notes: [] }));
}

function emptyStats(): Stats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    bestTimeByDifficulty: {},
    totalPoints: 0,
    currentStreakDays: 0,
    longestStreakDays: 0,
    lastPlayedDate: null,
    completedLevels: [],
  };
}

function baseFor(d: Difficulty): number {
  return { easy: 200, medium: 400, hard: 800, expert: 1500 }[d];
}
function targetTimeSec(d: Difficulty): number {
  return { easy: 300, medium: 600, hard: 1200, expert: 1800 }[d];
}

function computeScore(puzzle: Puzzle, timeSec: number, mistakes: number, hints: number): ScoreBreakdown {
  const base = baseFor(puzzle.difficulty);
  const target = targetTimeSec(puzzle.difficulty);
  const timeBonus = Math.max(0, Math.round(base * (1 - Math.min(1, timeSec / target)) * 0.6));
  const mistakePenalty = mistakes * 25;
  const hintPenalty = hints * 50;
  const noMistakeBonus = mistakes === 0 ? Math.round(base * 0.25) : 0;
  const noHintBonus = hints === 0 ? Math.round(base * 0.25) : 0;
  
  // Guaranteed minimum XP on level completion (always at least 50% of base XP!)
  const minGuaranteed = Math.round(base * 0.5);
  const calculatedTotal = base + timeBonus - mistakePenalty - hintPenalty + noMistakeBonus + noHintBonus;
  const total = Math.max(minGuaranteed, calculatedTotal);

  return { base, timeBonus, mistakePenalty, hintPenalty, noMistakeBonus, noHintBonus, total };
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function yesterdayKey(): string {
  const d = new Date(Date.now() - 86400_000);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Update stats after a confirmed win. Pure function — returns updated stats. */
function applyWinToStats(stats: Stats, puzzle: Puzzle, timeSec: number, score: ScoreBreakdown): Stats {
  const next = { ...stats, completedLevels: [...(stats.completedLevels ?? [])] };
  const isLevelGame = puzzle.levelNumber != null;
  const levelKey = isLevelGame ? `${puzzle.difficulty}-${puzzle.levelNumber}` : null;
  const isNewLevelWin = levelKey != null && !next.completedLevels.includes(levelKey);

  if (isNewLevelWin && levelKey) {
    next.completedLevels.push(levelKey);
    next.gamesWon += 1;
    next.gamesPlayed += 1;
  } else if (!isLevelGame) {
    next.gamesWon += 1;
    next.gamesPlayed += 1;
  }

  next.totalPoints += score.total;
  const best = next.bestTimeByDifficulty[puzzle.difficulty];
  if (best == null || timeSec < best) next.bestTimeByDifficulty[puzzle.difficulty] = timeSec;
  const today = todayKey();
  if (next.lastPlayedDate === yesterdayKey()) next.currentStreakDays += 1;
  else if (next.lastPlayedDate !== today) next.currentStreakDays = 1;
  next.longestStreakDays = Math.max(next.longestStreakDays, next.currentStreakDays);
  next.lastPlayedDate = today;

  // Track Game Completed analytics event
  try {
    const currentState = useGameStore.getState();
    const cells = currentState.cells ?? [];
    const history = currentState.history ?? [];
    const notesUsed = cells.some((c) => c.notes.length > 0) || history.some((m) => m.prev.notes.length > 0 || m.next.notes.length > 0);
    const autoRemoveIncorrect = useSettingsStore.getState().autoRemoveIncorrect;

    trackGameCompleted({
      difficulty: puzzle.difficulty,
      solveTimeSeconds: timeSec,
      mistakes: currentState.mistakes ?? 0,
      hintsUsed: currentState.hintsUsed ?? 0,
      undoCount: history.length,
      notesUsed,
      autoRemoveIncorrect,
    });
  } catch (err) {
    // Ignore error safely
  }

  return next;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      puzzle: null,
      cells: [],
      selected: null,
      notesMode: false,
      smartNotes: true,
      mistakeLimit: null,
      mistakes: 0,
      hintsUsed: 0,
      elapsedMs: 0,
      running: false,
      paused: false,
      hideTimer: false,
      history: [],
      future: [],
      won: false,
      score: null,
      stats: emptyStats(),
      flashIdx: null,

      newGame: (difficulty, level) => {
        const seedStr = level ? `zen-${difficulty}-lvl-${level}` : undefined;
        const puzzle = generatePuzzle(difficulty, seedStr, level);
        set({
          puzzle,
          cells: initCells(puzzle.puzzle),
          selected: null,
          mistakes: 0,
          hintsUsed: 0,
          elapsedMs: 0,
          running: true,
          paused: false,
          history: [],
          future: [],
          won: false,
          score: null,
          submitResult: null,
        });

        // Trigger analytics for starting a new puzzle
        trackNewPuzzle(difficulty);
        trackGameStarted(difficulty);
      },

      explanation: null,
      clearExplanation: () => set({ explanation: null }),
      clearFlash: () => set({ flashIdx: null }),

      explainCurrent: () => {
        const s = get();
        if (!s.puzzle || s.selected == null) return;
        const idx = s.selected;
        const cell = s.cells[idx];
        if (cell.value === 0) return;
        const explanation = explainMove(s.cells, s.puzzle.solution, idx, cell.value);
        set({ explanation });
      },

      select: (idx) => {
        playSelectSound();
        set({ selected: idx, explanation: null });
      },

      move: (dr, dc) => {
        const { selected } = get();
        if (selected == null) { set({ selected: 40, explanation: null }); return; }
        let r = Math.floor(selected / 9);
        let c = selected % 9;
        r = Math.max(0, Math.min(8, r + dr));
        c = Math.max(0, Math.min(8, c + dc));
        playSelectSound();
        set({ selected: r * 9 + c, explanation: null });
      },

      input: (value) => {
        const s = get();
        // BUG FIX: Don't accept input if already won
        if (!s.puzzle || s.won || s.paused) return;
        const idx = s.selected;
        if (idx == null) return;
        const cell = s.cells[idx];
        if (cell.given) return;

        const cells = s.cells.slice();
        const prev = { ...cell, notes: [...cell.notes] };

        if (s.notesMode && value !== 0) {
          if (cell.value !== 0) return;
          const notes = cell.notes.includes(value)
            ? cell.notes.filter((n) => n !== value)
            : [...cell.notes, value].sort();
          cells[idx] = { ...cell, notes };
          playNotesSound();
        } else if (value === 0) {
          cells[idx] = { ...cell, value: 0, notes: [] };
          playEraseSound();
        } else {
          // --- Move Instrumentation Log ---
          const r = Math.floor(idx / 9);
          const c = idx % 9;
          const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
          const rowVals = ROWS[r].map((i) => (i === idx ? value : cells[i].value)).filter((v) => v !== 0);
          const colVals = COLS[c].map((i) => (i === idx ? value : cells[i].value)).filter((v) => v !== 0);
          const boxVals = BOXES[b].map((i) => (i === idx ? value : cells[i].value)).filter((v) => v !== 0);

          const rowDup = rowVals.filter((v) => v === value).length > 1;
          const colDup = colVals.filter((v) => v === value).length > 1;
          const boxDup = boxVals.filter((v) => v === value).length > 1;
          const matchesSolution = s.puzzle.solution[idx] === value;
          const isRowValid = !rowDup;
          const isColValid = !colDup;
          const isBoxValid = !boxDup;
          const accepted = true; // State is updated regardless of correctness

          if (import.meta.env.DEV) {
            console.log(`
--------------------------------
Cell: (${r}, ${c}) [index ${idx}]
Attempted value: ${value}
Row contents: [${ROWS[r].map((i) => cells[i].value).join(", ")}]
Column contents: [${COLS[c].map((i) => cells[i].value).join(", ")}]
Box contents: [${BOXES[b].map((i) => cells[i].value).join(", ")}]
Row valid? ${isRowValid}
Column valid? ${isColValid}
Box valid? ${isBoxValid}
Matches solution? ${matchesSolution}
Accepted? ${accepted}
Reason: Move stored to board state. ${matchesSolution ? "Matches solution." : "Mistake logged (does not match solution)."} ${!isRowValid || !isColValid || !isBoxValid ? "Rule conflict introduced." : ""}
--------------------------------
            `);
          }

          cells[idx] = { ...cell, value, notes: [] };

          // track mistake if wrong
          if (s.puzzle.solution[idx] !== value) {
            playErrorSound();
            const mistakes = s.mistakes + 1;
            const nextState: Partial<GameState> = { mistakes, flashIdx: idx };
            if (s.mistakeLimit != null && mistakes >= s.mistakeLimit) {
              nextState.running = false;
            }
            // Haptic feedback on mobile (respects haptics setting)
            const { haptics, autoRemoveIncorrect } = useSettingsStore.getState();
            if (haptics && typeof navigator !== "undefined" && "vibrate" in navigator) {
              navigator.vibrate(80);
            }
            // If auto-remove is enabled, clear the wrong value immediately
            if (autoRemoveIncorrect) {
              cells[idx] = { ...cell, value: 0, notes: [] };
            }
            set(nextState as GameState);
            // Auto-clear flash after 300 ms
            setTimeout(() => useGameStore.getState().clearFlash(), 300);
          } else {
            playCorrectSound(value);
            if (s.smartNotes) {
              // strip this value from peer notes
              for (const p of PEERS[idx]) {
                const pc = cells[p];
                if (pc.value === 0 && pc.notes.includes(value)) {
                  cells[p] = { ...pc, notes: pc.notes.filter((n) => n !== value) };
                }
              }
            }
          }
        }

        const next = { ...cells[idx], notes: [...cells[idx].notes] };
        const history = [...s.history, { idx, prev, next }];
        set({ cells, history, future: [] });

        // Auto-win check: only triggers when all 81 cells are filled correctly
        const allFilled = cells.every((c) => c.value !== 0);
        if (allFilled) {
          const puzzle = get().puzzle!;
          const correct = cells.every((c, i) => c.value === puzzle.solution[i]);
          if (correct) {
            playWinSound();
            const timeSec = Math.floor(get().elapsedMs / 1000);
            const score = computeScore(puzzle, timeSec, get().mistakes, get().hintsUsed);
            // BUG FIX: use applyWinToStats to avoid double-counting
            const stats = applyWinToStats(get().stats, puzzle, timeSec, score);
            set({ won: true, running: false, score, stats });
          }
        }
      },

      clear: () => get().input(0),

      toggleNotes: () => {
        const nextNotesMode = !get().notesMode;
        set({ notesMode: nextNotesMode });
        trackNotesMode(nextNotesMode);
      },
      toggleSmartNotes: () => set((s) => ({ smartNotes: !s.smartNotes })),
      setMistakeLimit: (n) => set({ mistakeLimit: n }),
      toggleHideTimer: () => set((s) => ({ hideTimer: !s.hideTimer })),

      hint: () => {
        const s = get();
        if (!s.puzzle || s.won || s.paused) return;
        const current: Grid = s.cells.map((c) => c.value);

        let idx = -1;
        // Prioritize currently selected cell if empty or wrong
        if (s.selected != null && (!s.cells[s.selected].given && (s.cells[s.selected].value === 0 || s.cells[s.selected].value !== s.puzzle.solution[s.selected]))) {
          idx = s.selected;
        } else {
          idx = pickHintCell(current, s.puzzle.solution);
        }

        if (idx < 0) return;
        const v = s.puzzle.solution[idx];
        const cells = s.cells.slice();
        const prev = { ...cells[idx], notes: [...cells[idx].notes] };
        cells[idx] = { value: v, given: cells[idx].given, notes: [] };

        // Generate explanation for the hint
        const explanation = explainMove(cells, s.puzzle.solution, idx, v);
        playHintSound();

        set({
          cells,
          hintsUsed: s.hintsUsed + 1,
          selected: idx,
          explanation,
          history: [...s.history, { idx, prev, next: cells[idx] }],
          future: [],
        });

        trackHintUsed(s.puzzle.difficulty);
      },

      // BUG FIX: Implemented check() — was declared in interface but never implemented
      check: () => {
        const s = get();
        if (!s.puzzle) return 0;
        let wrong = 0;
        for (let i = 0; i < 81; i++) {
          const c = s.cells[i];
          if (!c.given && c.value !== 0 && c.value !== s.puzzle.solution[i]) {
            wrong++;
          }
        }
        return wrong;
      },

      submitResult: null,
      clearSubmitResult: () => set({ submitResult: null }),

      submitGame: () => {
        const s = get();
        // BUG FIX: Guard — if already won (auto-win), don't double-count stats
        if (!s.puzzle || s.won) return;

        const puzzle = s.puzzle;
        let emptyCount = 0;
        let wrongCount = 0;
        let totalFilled = 0;

        for (let i = 0; i < 81; i++) {
          const c = s.cells[i];
          if (c.value === 0) {
            emptyCount++;
          } else {
            totalFilled++;
            if (!c.given && c.value !== puzzle.solution[i]) {
              wrongCount++;
            }
          }
        }

        const isWin = emptyCount === 0 && wrongCount === 0;

        if (isWin) {
          const timeSec = Math.floor(s.elapsedMs / 1000);
          const score = computeScore(puzzle, timeSec, s.mistakes, s.hintsUsed);
          // BUG FIX: use applyWinToStats — consistent with auto-win path
          const stats = applyWinToStats(s.stats, puzzle, timeSec, score);
          set({ won: true, running: false, score, stats, submitResult: null });
        } else {
          set({
            submitResult: {
              isWin: false,
              totalFilled,
              emptyCount,
              wrongCount,
            },
          });
        }
      },

      undo: () => {
        const s = get();
        if (!s.history.length) return;
        const last = s.history[s.history.length - 1];
        const cells = s.cells.slice();
        cells[last.idx] = last.prev;
        set({
          cells,
          history: s.history.slice(0, -1),
          future: [...s.future, last],
          selected: last.idx,
        });

        if (s.puzzle) {
          trackUndoUsed(s.puzzle.difficulty);
        }
      },

      redo: () => {
        const s = get();
        if (!s.future.length) return;
        const last = s.future[s.future.length - 1];
        const cells = s.cells.slice();
        cells[last.idx] = last.next;
        set({
          cells,
          future: s.future.slice(0, -1),
          history: [...s.history, last],
          selected: last.idx,
        });
      },

      pause: () => set({ paused: true }),
      resume: () => set({ paused: false }),

      tick: (dt) => {
        const s = get();
        if (!s.running || s.paused || s.won) return;
        set({ elapsedMs: s.elapsedMs + dt });
      },

      reset: () =>
        set({
          puzzle: null,
          cells: [],
          selected: null,
          history: [],
          future: [],
          mistakes: 0,
          hintsUsed: 0,
          elapsedMs: 0,
          running: false,
          paused: false,
          won: false,
          score: null,
        }),
    }),
    {
      name: "sudoku-game-v1",
      partialize: (s) => ({
        puzzle: s.puzzle,
        cells: s.cells,
        notesMode: s.notesMode,
        smartNotes: s.smartNotes,
        mistakeLimit: s.mistakeLimit,
        mistakes: s.mistakes,
        hintsUsed: s.hintsUsed,
        elapsedMs: s.elapsedMs,
        running: s.running,
        hideTimer: s.hideTimer,
        history: s.history,
        future: s.future,
        won: s.won,
        score: s.score,
        stats: s.stats,
      }),
      // Deep-merge stats so adding new fields (e.g. completedLevels) doesn't
      // crash existing users whose localStorage snapshot is missing those fields.
      merge: (persisted: unknown, current: GameState): GameState => {
        const p = persisted as Partial<GameState>;
        const rawStats = {
          ...emptyStats(),
          ...(p.stats ?? {}),
        };
        // Auto-heal: sanitize gamesWon & gamesPlayed if previous double-counting created a mismatch with unique completed levels
        const completedLevels = rawStats.completedLevels ?? [];
        const completedCount = completedLevels.length;
        if (completedCount > 0 && rawStats.gamesWon > completedCount) {
          rawStats.gamesWon = completedCount;
          rawStats.gamesPlayed = completedCount;
        }

        // Auto-heal XP: guarantee every completed level has contributed at least 50% base XP to totalPoints
        if (completedCount > 0) {
          const minExpectedPoints = completedLevels.reduce((sum, key) => {
            const diff = (key.split("-")[0] || "easy") as Difficulty;
            const base = baseFor(diff);
            return sum + Math.round(base * 0.5);
          }, 0);
          if (rawStats.totalPoints < minExpectedPoints) {
            rawStats.totalPoints = minExpectedPoints;
          }
        }

        return {
          ...current,
          ...p,
          stats: rawStats,
        };
      },
    },
  ),
);

export function findGridConflicts(cells: CellState[]): Set<number> {
  return findConflicts(cells.map((c) => c.value));
}

/**
 * Solution-aware conflict detection.
 * A cell is highlighted as wrong ONLY when its value disagrees with the known solution.
 * This avoids false positives where two wrong cells share the same digit in a unit
 * and the correct newly-placed value gets flagged as the duplicate.
 */
export function findSolutionConflicts(cells: CellState[], solution: Grid): Set<number> {
  const out = new Set<number>();
  for (let i = 0; i < 81; i++) {
    const c = cells[i];
    if (c.value === 0 || c.given) continue;
    if (c.value !== solution[i]) out.add(i);
  }
  return out;
}

export function conflictsWithGiven(cells: CellState[], conflicts: Set<number>): Set<number> {
  const out = new Set<number>();
  for (const idx of conflicts) {
    if (cells[idx].given) continue;
    // check any peer with same value is a given
    const v = cells[idx].value;
    for (const p of PEERS[idx]) {
      if (cells[p].value === v && cells[p].given) {
        out.add(idx);
        break;
      }
    }
  }
  return out;
}

export interface BoardValidationReport {
  rowDuplicates: { row: number; value: number; indices: number[] }[];
  colDuplicates: { col: number; value: number; indices: number[] }[];
  boxDuplicates: { box: number; value: number; indices: number[] }[];
  solutionDisagreements: { idx: number; row: number; col: number; placed: number; expected: number }[];
  impossibleEmptyCells: {
    idx: number;
    row: number;
    col: number;
    box: number;
    explanation: {
      rowValues: number[];
      colValues: number[];
      boxValues: number[];
      rowAllows: number[];
      colAllows: number[];
      boxAllows: number[];
      intersection: number[];
    };
  }[];
}

export function validateEntireBoard(cells: CellState[], solution?: Grid): BoardValidationReport {
  const grid = cells.map((c) => c.value);
  const report: BoardValidationReport = {
    rowDuplicates: [],
    colDuplicates: [],
    boxDuplicates: [],
    solutionDisagreements: [],
    impossibleEmptyCells: [],
  };

  // 1. Check Row Duplicates
  for (let r = 0; r < 9; r++) {
    const seen = new Map<number, number[]>();
    for (const idx of ROWS[r]) {
      const v = grid[idx];
      if (v !== 0) {
        const arr = seen.get(v) ?? [];
        arr.push(idx);
        seen.set(v, arr);
      }
    }
    for (const [val, indices] of seen.entries()) {
      if (indices.length > 1) {
        report.rowDuplicates.push({ row: r, value: val, indices });
      }
    }
  }

  // 2. Check Col Duplicates
  for (let c = 0; c < 9; c++) {
    const seen = new Map<number, number[]>();
    for (const idx of COLS[c]) {
      const v = grid[idx];
      if (v !== 0) {
        const arr = seen.get(v) ?? [];
        arr.push(idx);
        seen.set(v, arr);
      }
    }
    for (const [val, indices] of seen.entries()) {
      if (indices.length > 1) {
        report.colDuplicates.push({ col: c, value: val, indices });
      }
    }
  }

  // 3. Check Box Duplicates
  for (let b = 0; b < 9; b++) {
    const seen = new Map<number, number[]>();
    for (const idx of BOXES[b]) {
      const v = grid[idx];
      if (v !== 0) {
        const arr = seen.get(v) ?? [];
        arr.push(idx);
        seen.set(v, arr);
      }
    }
    for (const [val, indices] of seen.entries()) {
      if (indices.length > 1) {
        report.boxDuplicates.push({ box: b, value: val, indices });
      }
    }
  }

  // 4. Check Disagreements with Stored Solution
  if (solution) {
    for (let i = 0; i < 81; i++) {
      if (grid[i] !== 0 && grid[i] !== solution[i]) {
        report.solutionDisagreements.push({
          idx: i,
          row: Math.floor(i / 9),
          col: i % 9,
          placed: grid[i],
          expected: solution[i],
        });
      }
    }
  }

  // 5. Check Impossible Empty Cells (0 legal candidates)
  for (let i = 0; i < 81; i++) {
    if (grid[i] !== 0) continue;
    const r = Math.floor(i / 9);
    const c = i % 9;
    const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);

    const rowVals = Array.from(new Set(ROWS[r].map((idx) => grid[idx]).filter((v) => v !== 0))).sort((a, b) => a - b);
    const colVals = Array.from(new Set(COLS[c].map((idx) => grid[idx]).filter((v) => v !== 0))).sort((a, b) => a - b);
    const boxVals = Array.from(new Set(BOXES[b].map((idx) => grid[idx]).filter((v) => v !== 0))).sort((a, b) => a - b);

    const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const rowAllows = ALL.filter((v) => !rowVals.includes(v));
    const colAllows = ALL.filter((v) => !colVals.includes(v));
    const boxAllows = ALL.filter((v) => !boxVals.includes(v));

    const usedPeerVals = new Set<number>();
    for (const p of PEERS[i]) {
      if (grid[p] !== 0) usedPeerVals.add(grid[p]);
    }
    const intersection = ALL.filter((v) => !usedPeerVals.has(v));

    if (intersection.length === 0) {
      report.impossibleEmptyCells.push({
        idx: i,
        row: r,
        col: c,
        box: b,
        explanation: {
          rowValues: rowVals,
          colValues: colVals,
          boxValues: boxVals,
          rowAllows,
          colAllows,
          boxAllows,
          intersection,
        },
      });
    }
  }

  return report;
}
