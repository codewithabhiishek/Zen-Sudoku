import type { Difficulty } from "@/lib/sudoku/types";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Layers, Sparkles, ChevronRight, Zap } from "lucide-react";

const DIFFICULTIES: { id: Difficulty; label: string; desc: string; color: string }[] = [
  { id: "easy", label: "Easy", desc: "Naked & Hidden Singles", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { id: "medium", label: "Medium", desc: "Pointing Pairs & Subsets", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  { id: "hard", label: "Hard", desc: "Box-Line & Hidden Pairs", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { id: "expert", label: "Expert", desc: "X-Wing & Advanced Trial", color: "text-rose-400 border-rose-500/30 bg-rose-500/10" },
];

const LEVELS_PER_DIFFICULTY = [1, 2, 3, 4, 5];

export function NewGameDialog({
  open,
  onClose,
  onStart,
  hasInProgress,
}: {
  open: boolean;
  onClose: () => void;
  onStart: (d: Difficulty, level?: number) => void;
  hasInProgress: boolean;
}) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("easy");
  const [loading, setLoading] = useState<string | null>(null);

  if (!open) return null;

  const pick = async (d: Difficulty, level: number) => {
    const key = `${d}-${level}`;
    setLoading(key);
    await new Promise((r) => setTimeout(r, 20));
    onStart(d, level);
    setLoading(null);
  };

  const activeDiff = DIFFICULTIES.find((item) => item.id === selectedDifficulty)!;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-all duration-300"
      role="dialog"
      aria-modal="true"
    >
      <div className="animate-modal-pop relative w-full max-w-lg overflow-hidden rounded-3xl border bg-surface/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="display text-2xl font-bold tracking-tight text-foreground">Select Game Level</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose difficulty category and level (1 - 5)
            </p>
          </div>
          <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Layers className="size-5" />
          </div>
        </div>

        {/* Difficulty Tabs */}
        <div className="mt-5 grid grid-cols-4 gap-1.5 rounded-2xl bg-muted/40 p-1.5 border">
          {DIFFICULTIES.map((d) => {
            const active = selectedDifficulty === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDifficulty(d.id)}
                className={cn(
                  "rounded-xl py-2 text-xs font-bold transition-all text-center",
                  active
                    ? "bg-surface text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        {/* Selected Difficulty Sub-header */}
        <div className="mt-4 flex items-center justify-between rounded-xl border bg-muted/20 px-3.5 py-2 text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" /> {activeDiff.label} Strategy
          </span>
          <span className="text-muted-foreground">{activeDiff.desc}</span>
        </div>

        {/* 5 Levels List */}
        <div className="mt-4 space-y-2">
          {LEVELS_PER_DIFFICULTY.map((lvl) => {
            const key = `${selectedDifficulty}-${lvl}`;
            const isLoadingThis = loading === key;

            return (
              <button
                key={lvl}
                onClick={() => pick(selectedDifficulty, lvl)}
                disabled={loading !== null}
                className="group flex w-full items-center justify-between rounded-2xl border bg-surface-2 p-3.5 text-left transition-all hover:border-primary/50 hover:bg-highlight/50 disabled:opacity-50 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "grid size-9 place-items-center rounded-xl font-mono font-bold text-xs border",
                      activeDiff.color,
                    )}
                  >
                    L{lvl}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground flex items-center gap-2">
                      Level {lvl}
                      {lvl === 5 && (
                        <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/20 flex items-center gap-1">
                          <Zap className="size-2.5" /> Challenge
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activeDiff.label} Puzzle • {38 - lvl * 2} Givens
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-primary transition group-hover:translate-x-1">
                  {isLoadingThis ? "Loading..." : "Play Level"} <ChevronRight className="size-4" />
                </div>
              </button>
            );
          })}
        </div>

        {hasInProgress && (
          <button
            onClick={onClose}
            className="mt-4 w-full rounded-2xl border border-transparent py-2.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
          >
            Keep Current Game
          </button>
        )}
      </div>
    </div>
  );
}
