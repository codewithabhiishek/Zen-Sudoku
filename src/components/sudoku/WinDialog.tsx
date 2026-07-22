import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import confetti from "canvas-confetti";

function fmt(ms: number) {
  const t = Math.floor(ms / 1000);
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function WinDialog({ onNewGame }: { onNewGame: () => void }) {
  const won = useGameStore((s) => s.won);
  const score = useGameStore((s) => s.score);
  const elapsed = useGameStore((s) => s.elapsedMs);
  const mistakes = useGameStore((s) => s.mistakes);
  const hints = useGameStore((s) => s.hintsUsed);
  const puzzle = useGameStore((s) => s.puzzle);
  const stats = useGameStore((s) => s.stats);

  useEffect(() => {
    if (!won) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 } });
  }, [won]);

  if (!won || !score || !puzzle) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border bg-surface p-6 shadow-2xl">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Puzzle solved</p>
        <h2 className="display text-3xl">Nicely done.</h2>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Time" value={fmt(elapsed)} />
          <Stat label="Mistakes" value={String(mistakes)} />
          <Stat label="Hints" value={String(hints)} />
        </div>
        <div className="mt-5 rounded-xl border bg-surface-2 p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Score</span>
            <span className="display text-3xl">{score.total}</span>
          </div>
          <dl className="space-y-1 text-sm">
            <Row label={`Base (${puzzle.difficulty})`} v={score.base} />
            <Row label="Time bonus" v={score.timeBonus} />
            {score.noMistakeBonus > 0 && <Row label="No mistakes" v={score.noMistakeBonus} />}
            {score.noHintBonus > 0 && <Row label="No hints" v={score.noHintBonus} />}
            {score.mistakePenalty > 0 && <Row label="Mistake penalty" v={-score.mistakePenalty} />}
            {score.hintPenalty > 0 && <Row label="Hint penalty" v={-score.hintPenalty} />}
          </dl>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Total points: {stats.totalPoints}</span>
          <span>Streak: {stats.currentStreakDays} 🔥</span>
        </div>
        <button
          onClick={onNewGame}
          className="mt-5 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition hover:opacity-90"
        >
          New puzzle
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-surface-2 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="display text-lg">{value}</div>
    </div>
  );
}
function Row({ label, v }: { label: string; v: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{v > 0 ? `+${v}` : v}</span>
    </div>
  );
}
