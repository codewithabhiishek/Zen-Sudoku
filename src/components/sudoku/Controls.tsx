import { useGameStore } from "@/store/gameStore";
import { HelpCircle, Home, Lightbulb, Pause, Play, Redo2, RotateCcw, Search, Send, Undo2, Clock, Eraser, PencilLine } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function fmt(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function GameHeader({ onNewGame }: { onNewGame: () => void }) {
  const puzzle = useGameStore((s) => s.puzzle);
  const elapsed = useGameStore((s) => s.elapsedMs);
  const paused = useGameStore((s) => s.paused);
  const pause = useGameStore((s) => s.pause);
  const resume = useGameStore((s) => s.resume);
  const tick = useGameStore((s) => s.tick);
  const running = useGameStore((s) => s.running);
  const won = useGameStore((s) => s.won);
  const mistakes = useGameStore((s) => s.mistakes);
  const mistakeLimit = useGameStore((s) => s.mistakeLimit);
  const hideTimer = useGameStore((s) => s.hideTimer);
  const toggleHideTimer = useGameStore((s) => s.toggleHideTimer);

  useEffect(() => {
    if (!running || paused || won) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      tick(now - last);
      last = now;
    }, 250);
    return () => clearInterval(id);
  }, [running, paused, won, tick]);

  return (
    <div className="mx-auto flex w-full max-w-[min(92vw,560px)] items-center justify-between py-1.5 sm:py-3">
      <div className="flex flex-1 items-center justify-between rounded-lg border bg-surface px-3 py-1.5 sm:px-4 sm:py-2">
        {/* Difficulty */}
        <div className="flex items-center gap-1 text-xs font-semibold capitalize text-muted-foreground sm:text-sm">
          <Home className="size-3.5 text-primary" />
          <span>
            {puzzle?.difficulty
              ? puzzle.difficulty.charAt(0).toUpperCase() + puzzle.difficulty.slice(1)
              : "—"}
            {puzzle?.levelNumber ? ` • Lv${puzzle.levelNumber}` : ""}
          </span>
        </div>

        {/* Mistakes */}
        <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground sm:text-sm" title="Mistakes made">
          <span>Mistakes</span>
          <span className="text-foreground">{mistakes}{mistakeLimit ? `/${mistakeLimit}` : ""}</span>
        </div>

        {/* Timer */}
        <button
          onClick={toggleHideTimer}
          className="flex items-center gap-1 font-mono text-xs font-semibold tabular-nums text-foreground transition hover:opacity-70 sm:text-sm"
          aria-label={hideTimer ? "Show timer" : "Hide timer"}
          title={hideTimer ? "Show timer" : "Hide timer"}
        >
          <Clock className="size-3.5 text-muted-foreground" />
          <span>{hideTimer ? "—:—" : fmt(elapsed)}</span>
        </button>
      </div>

      <div className="ml-1.5 flex items-center gap-1 sm:ml-3 sm:gap-1.5">
        <button
          onClick={() => (paused ? resume() : pause())}
          disabled={!running || won}
          className="btn-interactive grid h-8 w-9 place-items-center rounded-lg border bg-surface text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40 sm:h-10 sm:w-11"
          aria-label={paused ? "Resume" : "Pause"}
          title={paused ? "Resume" : "Pause"}
        >
          {paused ? <Play className="size-3.5 sm:size-4" /> : <Pause className="size-3.5 sm:size-4" />}
        </button>
        <button
          onClick={onNewGame}
          className="btn-interactive grid h-8 w-9 place-items-center rounded-lg border bg-surface text-muted-foreground transition hover:bg-muted hover:text-foreground sm:h-10 sm:w-11"
          title="Restart / Level Select"
          aria-label="New game"
        >
          <RotateCcw className="size-3.5 sm:size-4" />
        </button>
      </div>
    </div>
  );
}

export function Controls() {
  const undo = useGameStore((s) => s.undo);
  const redo = useGameStore((s) => s.redo);
  const hint = useGameStore((s) => s.hint);
  const check = useGameStore((s) => s.check);
  const input = useGameStore((s) => s.input);
  const notesMode = useGameStore((s) => s.notesMode);
  const toggleNotes = useGameStore((s) => s.toggleNotes);
  const selected = useGameStore((s) => s.selected);
  const cells = useGameStore((s) => s.cells);
  const explainCurrent = useGameStore((s) => s.explainCurrent);
  const hintsUsed = useGameStore((s) => s.hintsUsed);
  const historyLen = useGameStore((s) => s.history.length);
  const futureLen = useGameStore((s) => s.future.length);
  const [msg, setMsg] = useState<string | null>(null);

  const selectedHasValue = selected != null && cells[selected]?.value !== 0;

  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), 2000);
    return () => clearTimeout(id);
  }, [msg]);

  return (
    <div className="controls-bar mx-auto flex w-full max-w-[min(92vw,560px)] items-center justify-between gap-1 sm:gap-2">
      <button onClick={undo} disabled={!historyLen} className={btn}>
        <Undo2 className="size-3.5" /> <span className="hidden sm:inline">Undo</span>
      </button>
      <button onClick={redo} disabled={!futureLen} className={btn}>
        <Redo2 className="size-3.5" /> <span className="hidden sm:inline">Redo</span>
      </button>
      <button
        onClick={toggleNotes}
        className={cn(btn, notesMode && "bg-primary/10 text-primary border-primary/50")}
        aria-pressed={notesMode}
      >
        <PencilLine className="size-3.5" /> <span>Notes</span>
      </button>
      <button onClick={() => input(0)} className={btn}>
        <Eraser className="size-3.5" /> <span>Erase</span>
      </button>
      {selectedHasValue ? (
        <button onClick={explainCurrent} className={cn(btn, "border-primary/50 text-primary bg-primary/5 hover:bg-primary/10")}>
          <HelpCircle className="size-3.5" /> Explain
        </button>
      ) : (
        <button
          onClick={() => {
            const wrong = check();
            setMsg(wrong === 0 ? "Looking good so far" : `${wrong} wrong so far`);
          }}
          className={btn}
        >
          <Search className="size-3.5" /> Check
        </button>
      )}
      <button onClick={hint} className={btn}>
        <Lightbulb className="size-3.5" /> Hint ({hintsUsed})
      </button>
      {msg && (
        <div
          role="status"
          className="pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg border bg-surface px-3 py-2 text-sm shadow"
        >
          {msg}
        </div>
      )}
    </div>
  );
}

export function PrimarySubmitButton() {
  const submitGame = useGameStore((s) => s.submitGame);
  return (
    <button
      onClick={submitGame}
      className="btn-interactive flex h-12 w-full max-w-[min(92vw,560px)] items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-4 font-bold text-primary-foreground shadow-md transition hover:bg-primary/90"
    >
      <Send className="size-4" /> Submit Puzzle
    </button>
  );
}

const btn = cn(
  "btn-interactive flex h-11 flex-1 items-center justify-center gap-1 rounded-lg border border-border/80 bg-surface px-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40 sm:px-2.5 sm:text-sm",
);
