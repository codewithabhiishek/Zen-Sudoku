import { useMemo } from "react";
import { useGameStore } from "@/store/gameStore";
import { PrimarySubmitButton } from "@/components/sudoku/Controls";
import { cn } from "@/lib/utils";

export function Keypad() {
  const input = useGameStore((s) => s.input);
  const cells = useGameStore((s) => s.cells);
  const puzzle = useGameStore((s) => s.puzzle);
  const notesMode = useGameStore((s) => s.notesMode);

  const remaining = useMemo(() => {
    const counts = new Array(10).fill(0);
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      if (!c.value) continue;
      if (c.given || (puzzle && c.value === puzzle.solution[i])) {
        counts[c.value]++;
      }
    }
    return counts.map((n) => 9 - n);
  }, [cells, puzzle]);

  return (
    <div className="mx-auto flex w-full max-w-[min(92vw,560px)] flex-col gap-2">
      {/* 9-Column Digit Keypad */}
      <div className="grid grid-cols-9 gap-1 sm:gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
          const left = remaining[n];
          const done = left <= 0;
          return (
            <button
              key={n}
              onClick={() => input(n)}
              disabled={done && !notesMode}
              aria-label={`Enter ${n}${done ? " (complete)" : ""}`}
              className={cn(
                "btn-interactive relative flex h-11 sm:h-12 flex-1 items-center justify-center rounded-lg border bg-surface font-display text-xl sm:text-2xl font-semibold transition hover:bg-muted disabled:opacity-30",
              )}
            >
              <span className="sudoku-num text-foreground">{n}</span>
              <span className="pointer-events-none absolute bottom-0.5 right-1 text-[0.55rem] text-muted-foreground font-mono">
                {Math.max(0, left)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Visually Dominant Full-Width Submit Button */}
      <div className="pt-0.5 sm:pt-1">
        <PrimarySubmitButton />
      </div>
    </div>
  );
}
