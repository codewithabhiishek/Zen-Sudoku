import { useMemo } from "react";
import { useGameStore } from "@/store/gameStore";
import { cn } from "@/lib/utils";
import { Eraser, PencilLine } from "lucide-react";

export function Keypad() {
  const input = useGameStore((s) => s.input);
  const cells = useGameStore((s) => s.cells);
  const puzzle = useGameStore((s) => s.puzzle);
  const notesMode = useGameStore((s) => s.notesMode);
  const toggleNotes = useGameStore((s) => s.toggleNotes);

  const remaining = useMemo(() => {
    const counts = new Array(10).fill(0);
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      if (!c.value) continue;
      // FIX: Only count given numbers OR correct user entries matching the solution.
      // Incorrect user entries should NOT decrement remaining counts or disable keypad buttons.
      if (c.given || (puzzle && c.value === puzzle.solution[i])) {
        counts[c.value]++;
      }
    }
    return counts.map((n) => 9 - n);
  }, [cells, puzzle]);

  return (
    <div className="mx-auto w-full max-w-[min(92vw,560px)] space-y-2">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={toggleNotes}
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition",
            notesMode ? "bg-primary text-primary-foreground border-primary" : "bg-surface hover:bg-muted",
          )}
          aria-pressed={notesMode}
        >
          <PencilLine className="size-4" /> Notes {notesMode ? "on" : "off"}
        </button>
        <button
          onClick={() => input(0)}
          className="flex min-h-11 items-center gap-2 rounded-lg border bg-surface px-3 text-sm font-medium transition hover:bg-muted"
        >
          <Eraser className="size-4" /> Erase
        </button>
      </div>
      <div className="grid grid-cols-9 gap-1.5">
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
                "relative flex aspect-square min-h-11 items-center justify-center rounded-lg border bg-surface font-display text-2xl font-semibold transition active:scale-95 hover:bg-muted disabled:opacity-30",
              )}
            >
              <span className="sudoku-num text-foreground">{n}</span>
              <span className="pointer-events-none absolute bottom-0.5 right-1 text-[0.55rem] text-muted-foreground">
                {Math.max(0, left)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
