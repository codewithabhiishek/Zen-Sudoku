import { useGameStore } from "@/store/gameStore";
import { AlertCircle, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SubmitModal() {
  const submitResult = useGameStore((s) => s.submitResult);
  const clearSubmitResult = useGameStore((s) => s.clearSubmitResult);

  if (!submitResult || submitResult.isWin) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-all duration-300"
      onClick={clearSubmitResult}
    >
      <div
        className="animate-modal-pop relative w-full max-w-md overflow-hidden rounded-3xl border border-primary/30 bg-surface/95 p-6 shadow-2xl backdrop-blur-xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <AlertCircle className="size-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-foreground">Submission Results</h3>
              <p className="text-xs text-muted-foreground">Puzzle Validation Breakdown</p>
            </div>
          </div>
          <button
            onClick={clearSubmitResult}
            className="grid size-8 place-items-center rounded-full hover:bg-muted text-muted-foreground transition"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <p className="text-sm font-medium text-foreground/90">
            Your puzzle submission is not complete yet. Here is the current breakdown:
          </p>

          <div className="grid grid-cols-3 gap-2 text-center pt-2">
            <div className="rounded-2xl border bg-muted/30 p-3">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase">Filled</div>
              <div className="text-lg font-bold tabular-nums text-foreground mt-0.5">{submitResult.totalFilled}/81</div>
            </div>
            <div className="rounded-2xl border bg-muted/30 p-3">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase">Empty</div>
              <div className="text-lg font-bold tabular-nums text-foreground mt-0.5">{submitResult.emptyCount}</div>
            </div>
            <div className="rounded-2xl border bg-muted/30 p-3">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase">Errors</div>
              <div className={cn("text-lg font-bold tabular-nums mt-0.5", submitResult.wrongCount > 0 ? "text-rose-400" : "text-emerald-400")}>
                {submitResult.wrongCount}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={clearSubmitResult}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 active:scale-95"
          >
            Keep Playing <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
