import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CellState, Difficulty, Grid, Puzzle } from "@/lib/sudoku/types";
import { findConflicts, PEERS } from "@/lib/sudoku/solver";
import { generatePuzzle } from "@/lib/sudoku/generator";
import { pickHintCell } from "@/lib/sudoku/techniques";
import { explainMove } from "@/lib/sudoku/explainer";

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
  const mistakePenalty = mistakes * 50;
  const hintPenalty = hints * 100;
  const noMistakeBonus = mistakes === 0 ? Math.round(base * 0.2) : 0;
  const noHintBonus = hints === 0 ? Math.round(base * 0.2) : 0;
  const total = Math.max(
    0,
    base + timeBonus - mistakePenalty - hintPenalty + noMistakeBonus + noHintBonus,
  );
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
        });
      },

      explanation: null,
      clearExplanation: () => set({ explanation: null }),

      explainCurrent: () => {
        const s = get();
        if (!s.puzzle || s.selected == null) return;
        const idx = s.selected;
        const cell = s.cells[idx];
        if (cell.value === 0) return;
        const explanation = explainMove(s.cells, s.puzzle.solution, idx, cell.value);
        set({ explanation });
      },

      select: (idx) => set({ selected: idx, explanation: null }),

      move: (dr, dc) => {
        const { selected } = get();
        if (selected == null) { set({ selected: 40, explanation: null }); return; }
        let r = Math.floor(selected / 9);
        let c = selected % 9;
        r = Math.max(0, Math.min(8, r + dr));
        c = Math.max(0, Math.min(8, c + dc));
        set({ selected: r * 9 + c, explanation: null });
      },

      input: (value) => {
        const s = get();
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
        } else if (value === 0) {
          cells[idx] = { ...cell, value: 0, notes: [] };
        } else {
          cells[idx] = { ...cell, value, notes: [] };

          // track mistake if wrong
          if (s.puzzle.solution[idx] !== value) {
            const mistakes = s.mistakes + 1;
            const nextState: Partial<GameState> = { mistakes };
            if (s.mistakeLimit != null && mistakes >= s.mistakeLimit) {
              nextState.running = false;
            }
            set(nextState as GameState);
          } else if (s.smartNotes) {
            // strip this value from peer notes
            for (const p of PEERS[idx]) {
              const pc = cells[p];
              if (pc.value === 0 && pc.notes.includes(value)) {
                cells[p] = { ...pc, notes: pc.notes.filter((n) => n !== value) };
              }
            }
          }
        }

        const next = { ...cells[idx], notes: [...cells[idx].notes] };
        const history = [...s.history, { idx, prev, next }];
        set({ cells, history, future: [] });

        // Win check
        const allFilled = cells.every((c) => c.value !== 0);
        if (allFilled && get().puzzle) {
          const puzzle = get().puzzle!;
          const correct = cells.every((c, i) => c.value === puzzle.solution[i]);
          if (correct) {
            const timeSec = Math.floor(get().elapsedMs / 1000);
            const score = computeScore(puzzle, timeSec, get().mistakes, get().hintsUsed);
            const stats = { ...get().stats };
            stats.gamesPlayed += 1;
            stats.gamesWon += 1;
            stats.totalPoints += score.total;
            const best = stats.bestTimeByDifficulty[puzzle.difficulty];
            if (best == null || timeSec < best) stats.bestTimeByDifficulty[puzzle.difficulty] = timeSec;
            const today = todayKey();
            if (stats.lastPlayedDate === yesterdayKey()) stats.currentStreakDays += 1;
            else if (stats.lastPlayedDate !== today) stats.currentStreakDays = 1;
            stats.longestStreakDays = Math.max(stats.longestStreakDays, stats.currentStreakDays);
            stats.lastPlayedDate = today;
            set({ won: true, running: false, score, stats });
          }
        }
      },

      clear: () => get().input(0),

      toggleNotes: () => set((s) => ({ notesMode: !s.notesMode })),
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

        set({
          cells,
          hintsUsed: s.hintsUsed + 1,
          selected: idx,
          explanation,
          history: [...s.history, { idx, prev, next: cells[idx] }],
          future: [],
        });
      },

      submitResult: null,
      clearSubmitResult: () => set({ submitResult: null }),

      submitGame: () => {
        const s = get();
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
          const timeSec = Math.floor(get().elapsedMs / 1000);
          const score = computeScore(puzzle, timeSec, get().mistakes, get().hintsUsed);
          const stats = { ...get().stats };
          stats.gamesPlayed += 1;
          stats.gamesWon += 1;
          stats.totalPoints += score.total;
          const best = stats.bestTimeByDifficulty[puzzle.difficulty];
          if (best == null || timeSec < best) stats.bestTimeByDifficulty[puzzle.difficulty] = timeSec;
          const today = todayKey();
          if (stats.lastPlayedDate === yesterdayKey()) stats.currentStreakDays += 1;
          else if (stats.lastPlayedDate !== today) stats.currentStreakDays = 1;
          stats.longestStreakDays = Math.max(stats.longestStreakDays, stats.currentStreakDays);
          stats.lastPlayedDate = today;
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
    },
  ),
);

export function findGridConflicts(cells: CellState[]): Set<number> {
  return findConflicts(cells.map((c) => c.value));
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
