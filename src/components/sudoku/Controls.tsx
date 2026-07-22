import { useGameStore } from "@/store/gameStore";
import { Lightbulb, Pause, Play, Redo2, RotateCcw, Search, Undo2 } from "lucide-react";
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
    <div className="mx-auto flex w-full max-w-[min(92vw,560px)] items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-2">
        <span className="rounded-md border bg-surface px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {puzzle?.difficulty ?? "—"}
        </span>
        <span className="text-xs text-muted-foreground">
          Mistakes: <span className="text-foreground">{mistakes}{mistakeLimit ? `/${mistakeLimit}` : ""}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleHideTimer}
          className="rounded-md px-2 py-1 font-mono text-lg tabular-nums text-foreground hover:bg-muted"
          aria-label={hideTimer ? "Show timer" : "Hide timer"}
        >
          {hideTimer ? "—:—" : fmt(elapsed)}
        </button>
        <button
          onClick={() => (paused ? resume() : pause())}
          disabled={!running || won}
          className="grid size-11 place-items-center rounded-md border bg-surface transition hover:bg-muted disabled:opacity-40"
          aria-label={paused ? "Resume" : "Pause"}
        >
          {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
        </button>
        <button
          onClick={onNewGame}
          className="grid size-11 place-items-center rounded-md border bg-surface transition hover:bg-muted"
          aria-label="New game"
        >
          <RotateCcw className="size-4" />
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
  const hintsUsed = useGameStore((s) => s.hintsUsed);
  const historyLen = useGameStore((s) => s.history.length);
  const futureLen = useGameStore((s) => s.future.length);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), 2000);
    return () => clearTimeout(id);
  }, [msg]);

  return (
    <div className="mx-auto flex w-full max-w-[min(92vw,560px)] items-center justify-between gap-2">
      <button onClick={undo} disabled={!historyLen} className={btn}>
        <Undo2 className="size-4" /> Undo
      </button>
      <button onClick={redo} disabled={!futureLen} className={btn}>
        <Redo2 className="size-4" /> Redo
      </button>
      <button
        onClick={() => {
          const wrong = check();
          setMsg(wrong === 0 ? "Looking good so far" : `${wrong} wrong so far`);
        }}
        className={btn}
      >
        <Search className="size-4" /> Check
      </button>
      <button onClick={hint} className={btn}>
        <Lightbulb className="size-4" /> Hint <span className="text-muted-foreground">({hintsUsed})</span>
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

const btn = cn(
  "flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border bg-surface px-2 text-sm font-medium transition hover:bg-muted disabled:opacity-40",
);
