import { useGameStore } from "@/store/gameStore";
import { AlertCircle, CheckCircle2, HelpCircle, X, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function MoveExplanationModal() {
  const explanation = useGameStore((s) => s.explanation);
  const clearExplanation = useGameStore((s) => s.clearExplanation);
  const undo = useGameStore((s) => s.undo);

  if (!explanation) return null;

  const isSuccess = explanation.isCorrect;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity"
      onClick={clearExplanation}
    >
      <div
        className="animate-modal-pop relative w-full max-w-md overflow-hidden rounded-2xl border bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "grid size-10 place-items-center rounded-xl",
                isSuccess
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
              )}
            >
              {isSuccess ? <CheckCircle2 className="size-5" /> : <AlertCircle className="size-5" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{explanation.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Sudoku Hint & Analysis</p>
            </div>
          </div>
          <button
            onClick={clearExplanation}
            className="grid size-8 place-items-center rounded-lg hover:bg-muted text-muted-foreground transition"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-sm leading-relaxed text-foreground/90 font-normal">
            {explanation.reason}
          </p>

          <div className="rounded-xl border bg-muted/20 p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <HelpCircle className="size-3.5 text-primary" /> Logical Proof
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {explanation.details.map((detail, i) => (
                <li key={i} className="flex items-start gap-2 leading-relaxed">
                  <span className="mt-1 size-1 rounded-full bg-muted-foreground/60 shrink-0" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          {!isSuccess && (
            <button
              onClick={() => {
                undo();
                clearExplanation();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border bg-surface px-4 py-2.5 text-xs font-medium text-foreground transition hover:bg-muted"
            >
              <Undo2 className="size-3.5" /> Undo Move
            </button>
          )}
          <button
            onClick={clearExplanation}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground transition hover:opacity-90"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
