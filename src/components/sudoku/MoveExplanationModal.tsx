import { useGameStore } from "@/store/gameStore";
import { AlertTriangle, CheckCircle2, HelpCircle, X, Undo2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function MoveExplanationModal() {
  const explanation = useGameStore((s) => s.explanation);
  const clearExplanation = useGameStore((s) => s.clearExplanation);
  const undo = useGameStore((s) => s.undo);

  if (!explanation) return null;

  const isSuccess = explanation.isCorrect;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-all duration-300"
      onClick={clearExplanation}
    >
      <div
        className={cn(
          "animate-modal-pop relative w-full max-w-md overflow-hidden rounded-3xl border bg-surface/95 p-6 shadow-2xl backdrop-blur-xl transition-all",
          isSuccess
            ? "border-emerald-500/40 shadow-emerald-500/10 ring-1 ring-emerald-500/20"
            : "border-rose-500/40 shadow-rose-500/10 ring-1 ring-rose-500/20 animate-shake",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Glow accent */}
        <div
          className={cn(
            "absolute -top-12 -left-12 size-32 rounded-full blur-2xl opacity-40 pointer-events-none",
            isSuccess ? "bg-emerald-500" : "bg-rose-500",
          )}
        />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "grid size-11 place-items-center rounded-2xl shadow-inner transition-transform duration-300 scale-100 hover:scale-105",
                isSuccess
                  ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                  : "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30",
              )}
            >
              {isSuccess ? <CheckCircle2 className="size-6" /> : <AlertTriangle className="size-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-foreground">{explanation.title}</h3>
              </div>
              <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground mt-0.5">
                <Sparkles className="size-3 text-primary" /> Sudoku Mathematical Breakdown
              </p>
            </div>
          </div>
          <button
            onClick={clearExplanation}
            className="grid size-8 place-items-center rounded-full hover:bg-muted text-muted-foreground transition"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <p className="text-sm leading-relaxed text-foreground/90 font-medium">
            {explanation.reason}
          </p>

          <div className="rounded-2xl border bg-muted/30 p-4 space-y-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <HelpCircle className="size-3.5 text-primary" /> Logical Proof & Constraints
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {explanation.details.map((detail, i) => (
                <li key={i} className="flex items-start gap-2 leading-relaxed">
                  <span className={cn("mt-1 size-1.5 rounded-full shrink-0", isSuccess ? "bg-emerald-400" : "bg-rose-400")} />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          {!isSuccess && (
            <button
              onClick={() => {
                undo();
                clearExplanation();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-400 transition hover:bg-rose-500/20 active:scale-95 shadow-sm"
            >
              <Undo2 className="size-4" /> Undo Move
            </button>
          )}
          <button
            onClick={clearExplanation}
            className={cn(
              "flex-1 rounded-2xl px-5 py-3 text-sm font-bold transition-all active:scale-95 shadow-lg",
              isSuccess
                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20",
            )}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
