import { useEffect, useMemo } from "react";
import { useGameStore, findGridConflicts, conflictsWithGiven } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";
import { PEERS, ROWS, COLS, BOXES } from "@/lib/sudoku/solver";
import { cn } from "@/lib/utils";

export function Board() {
  const cells = useGameStore((s) => s.cells);
  const selected = useGameStore((s) => s.selected);
  const select = useGameStore((s) => s.select);
  const move = useGameStore((s) => s.move);
  const input = useGameStore((s) => s.input);
  const toggleNotes = useGameStore((s) => s.toggleNotes);
  const undo = useGameStore((s) => s.undo);
  const redo = useGameStore((s) => s.redo);
  const paused = useGameStore((s) => s.paused);
  const won = useGameStore((s) => s.won);
  const highlightSame = useSettingsStore((s) => s.highlightSame);
  const highlightPeers = useSettingsStore((s) => s.highlightPeers);
  const fontScale = useSettingsStore((s) => s.fontScale);

  const conflicts = useMemo(() => findGridConflicts(cells), [cells]);
  const givenConflicts = useMemo(() => conflictsWithGiven(cells, conflicts), [cells, conflicts]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key;
      if (k >= "1" && k <= "9") { input(parseInt(k, 10)); e.preventDefault(); return; }
      if (k === "0" || k === "Backspace" || k === "Delete") { input(0); e.preventDefault(); return; }
      if (k === "ArrowUp") { move(-1, 0); e.preventDefault(); }
      else if (k === "ArrowDown") { move(1, 0); e.preventDefault(); }
      else if (k === "ArrowLeft") { move(0, -1); e.preventDefault(); }
      else if (k === "ArrowRight") { move(0, 1); e.preventDefault(); }
      else if (k === "n" || k === "N") { toggleNotes(); e.preventDefault(); }
      else if ((k === "z" || k === "Z") && (e.metaKey || e.ctrlKey) && e.shiftKey) { redo(); e.preventDefault(); }
      else if ((k === "z" || k === "Z") && (e.metaKey || e.ctrlKey)) { undo(); e.preventDefault(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [input, move, toggleNotes, undo, redo]);

  if (cells.length !== 81) return null;

  const selectedValue = selected != null ? cells[selected].value : 0;
  const peerSet = selected != null ? new Set(PEERS[selected]) : new Set<number>();
  const rowSet = selected != null ? new Set(ROWS[Math.floor(selected / 9)]) : new Set<number>();
  const colSet = selected != null ? new Set(COLS[selected % 9]) : new Set<number>();
  const boxIdx =
    selected != null
      ? Math.floor(Math.floor(selected / 9) / 3) * 3 + Math.floor((selected % 9) / 3)
      : -1;
  const boxSet = boxIdx >= 0 ? new Set(BOXES[boxIdx]) : new Set<number>();

  return (
    <div
      className="relative mx-auto grid aspect-square w-full max-w-[min(92vw,560px)] grid-cols-9 grid-rows-9 overflow-hidden rounded-xl border-2 bg-surface shadow-lg"
      style={{ borderColor: "var(--color-border-strong)" }}
      role="grid"
      aria-label="Sudoku board"
    >
      {cells.map((cell, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        const isSelected = selected === i;
        const inPeer = highlightPeers && !isSelected && (rowSet.has(i) || colSet.has(i) || boxSet.has(i));
        const inSame =
          highlightSame && !isSelected && selectedValue !== 0 && cell.value === selectedValue;
        const isConflict = conflicts.has(i);
        const isGivenConflict = givenConflicts.has(i);

        return (
          <button
            key={i}
            type="button"
            role="gridcell"
            aria-label={`Row ${r + 1} column ${c + 1} ${cell.given ? "given" : "editable"} ${cell.value ? `value ${cell.value}` : "empty"}`}
            aria-selected={isSelected}
            onClick={() => select(i)}
            className={cn(
              "sudoku-cell relative flex items-center justify-center border border-border transition-colors focus:outline-none",
              "text-[calc(min(4.5vw,26px)*var(--font-scale,1))] leading-none",
              // thick borders every 3
              (c === 2 || c === 5) && "border-r-2 border-r-[color:var(--color-border-strong)]",
              (r === 2 || r === 5) && "border-b-2 border-b-[color:var(--color-border-strong)]",
              inPeer && "bg-highlight",
              inSame && "bg-same",
              isConflict && "bg-conflict",
              isSelected && "bg-highlight-strong ring-2 ring-[color:var(--color-primary)]",
              paused && "invisible",
              won && "pointer-events-none",
            )}
            style={{ "--font-scale": fontScale } as React.CSSProperties}
          >
            {cell.value !== 0 ? (
              <span
                className={cn(
                  "sudoku-num font-semibold tabular-nums",
                  cell.given ? "text-given" : "text-user",
                  isConflict && "text-danger",
                  isGivenConflict && "underline decoration-danger decoration-2",
                )}
              >
                {cell.value}
              </span>
            ) : cell.notes.length > 0 ? (
              <div
                className="grid h-full w-full grid-cols-3 grid-rows-3 p-[6%] text-[0.32em] leading-none text-muted-foreground"
                aria-hidden
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <span key={n} className="flex items-center justify-center">
                    {cell.notes.includes(n) ? n : ""}
                  </span>
                ))}
              </div>
            ) : null}
          </button>
        );
      })}
      {paused && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface/95">
          <p className="display text-2xl">Paused</p>
        </div>
      )}
    </div>
  );
}
