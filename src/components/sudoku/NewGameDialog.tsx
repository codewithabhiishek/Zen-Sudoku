import type { Difficulty } from "@/lib/sudoku/types";
import { useState } from "react";

const OPTIONS: { id: Difficulty; label: string; desc: string }[] = [
  { id: "easy", label: "Easy", desc: "Naked & hidden singles" },
  { id: "medium", label: "Medium", desc: "Pairs & pointing pairs" },
  { id: "hard", label: "Hard", desc: "Hidden pairs, box-line" },
  { id: "expert", label: "Expert", desc: "X-Wing or trial cells" },
];

export function NewGameDialog({
  open,
  onClose,
  onStart,
  hasInProgress,
}: {
  open: boolean;
  onClose: () => void;
  onStart: (d: Difficulty) => void;
  hasInProgress: boolean;
}) {
  const [loading, setLoading] = useState<Difficulty | null>(null);
  if (!open) return null;

  const pick = async (d: Difficulty) => {
    setLoading(d);
    // let the browser paint the "Generating…" state before the sync generator runs
    await new Promise((r) => setTimeout(r, 20));
    onStart(d);
    setLoading(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl border bg-surface p-6 shadow-2xl">
        <h2 className="display text-2xl">New game</h2>
        {hasInProgress && (
          <p className="mt-1 text-sm text-muted-foreground">
            Your current game will be discarded.
          </p>
        )}
        <div className="mt-5 grid gap-2">
          {OPTIONS.map((o) => (
            <button
              key={o.id}
              onClick={() => pick(o.id)}
              disabled={loading !== null}
              className="flex items-center justify-between rounded-xl border bg-surface-2 px-4 py-3 text-left transition hover:border-primary hover:bg-highlight disabled:opacity-50"
            >
              <div>
                <div className="font-semibold">{o.label}</div>
                <div className="text-xs text-muted-foreground">{o.desc}</div>
              </div>
              <div className="text-sm text-muted-foreground">
                {loading === o.id ? "Generating…" : "Start →"}
              </div>
            </button>
          ))}
        </div>
        {hasInProgress && (
          <button
            onClick={onClose}
            className="mt-4 w-full rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            Keep current game
          </button>
        )}
      </div>
    </div>
  );
}
