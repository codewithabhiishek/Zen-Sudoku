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
    confetti({ particleCount: 75, spread: 60, origin: { y: 0.4 } });
  }, [won]);

  if (!won || !score || !puzzle) return null;

  const isPerfectRun = mistakes === 0 && hints === 0;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-md animate-backdrop-fade-in">
      <div className="w-full max-w-md rounded-2xl border bg-surface p-6 sm:p-8 shadow-2xl animate-modal-pop">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-500">
            ✓ Puzzle Complete
          </div>
          {isPerfectRun && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500">
              ✨ Perfect Run
            </div>
          )}
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <h2 className="display text-4xl font-bold tracking-tight">{fmt(elapsed)}</h2>
          {score.total > 0 ? (
            <span className="display text-2xl font-bold text-primary">+{score.total} XP</span>
          ) : (
            <span className="display text-base font-semibold text-muted-foreground">0 XP — too many mistakes</span>
          )}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 text-center">
          <Stat label="Time" value={fmt(elapsed)} />
          <Stat label="Mistakes" value={String(mistakes)} />
          <Stat label="Hints" value={String(hints)} />
        </div>

        <div className="mt-5 rounded-xl border bg-surface-2 p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Score Breakdown</span>
            <span className="font-mono text-sm font-bold">{score.total} pts</span>
          </div>
          <dl className="space-y-1.5 text-xs">
            <Row label={`Base (${puzzle.difficulty})`} v={score.base} />
            <Row label="Time bonus" v={score.timeBonus} />
            {score.noMistakeBonus > 0 && <Row label="No mistakes bonus" v={score.noMistakeBonus} />}
            {score.noHintBonus > 0 && <Row label="No hints bonus" v={score.noHintBonus} />}
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
          className="btn-interactive mt-6 w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground shadow-md transition hover:bg-primary/90"
        >
          Next Puzzle
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
