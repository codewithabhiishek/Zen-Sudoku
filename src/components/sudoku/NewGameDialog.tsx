import type { Difficulty } from "@/lib/sudoku/types";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Layers, Sparkles, ChevronRight, Zap, Flame, ShieldAlert } from "lucide-react";

/** Mirrors clueTargetFor() in generator.ts so the UI shows accurate clue counts */
function getClueCount(d: Difficulty, level: number): number {
  const step = Math.min(9, Math.max(0, level - 1));
  switch (d) {
    case "easy":   return Math.max(34, 42 - Math.floor(step * 0.8));
    case "medium": return Math.max(28, 35 - Math.floor(step * 0.8));
    case "hard":   return Math.max(22, 28 - Math.floor(step * 0.7));
    case "expert": return Math.max(17, 23 - Math.floor(step * 0.6));
  }
}

const DIFFICULTIES: { id: Difficulty; label: string; desc: string; color: string }[] = [
  { id: "easy", label: "Easy", desc: "Naked & Hidden Singles", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { id: "medium", label: "Medium", desc: "Pointing Pairs & Subsets", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  { id: "hard", label: "Hard", desc: "Box-Line & Hidden Pairs", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { id: "expert", label: "Expert", desc: "X-Wing & Advanced Trial", color: "text-rose-400 border-rose-500/30 bg-rose-500/10" },
];

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const LEVEL_TAGS: Record<number, { name: string; tagColor: string }> = {
  1: { name: "Starter", tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  2: { name: "Rookie", tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  3: { name: "Novice", tagColor: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  4: { name: "Skilled", tagColor: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  5: { name: "Pro", tagColor: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  6: { name: "Advanced", tagColor: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  7: { name: "Hardcore", tagColor: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  8: { name: "Extreme", tagColor: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  9: { name: "Master", tagColor: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  10: { name: "Grandmaster", tagColor: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
};

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
              10 Levels for each difficulty (Level 1 to Level 10)
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
            <Sparkles className="size-3.5 text-primary" /> {activeDiff.label} Tier
          </span>
          <span className="text-muted-foreground">{activeDiff.desc}</span>
        </div>

        {/* 10 Levels Scrollable List */}
        <div className="mt-4 max-h-[340px] overflow-y-auto pr-1 space-y-2">
          {LEVELS.map((lvl) => {
            const key = `${selectedDifficulty}-${lvl}`;
            const isLoadingThis = loading === key;
            const tag = LEVEL_TAGS[lvl];

            return (
              <button
                key={lvl}
                onClick={() => pick(selectedDifficulty, lvl)}
                disabled={loading !== null}
                className="group flex w-full items-center justify-between rounded-2xl border bg-surface-2 p-3 text-left transition-all hover:border-primary/50 hover:bg-highlight/50 disabled:opacity-50 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "grid size-9 place-items-center rounded-xl font-mono font-bold text-xs border shrink-0",
                      activeDiff.color,
                    )}
                  >
                    L{lvl}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground flex items-center gap-2">
                      Level {lvl}
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold border flex items-center gap-1", tag.tagColor)}>
                        {lvl >= 9 ? <Flame className="size-2.5" /> : lvl >= 7 ? <ShieldAlert className="size-2.5" /> : <Zap className="size-2.5" />}
                        {tag.name}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activeDiff.label} • {getClueCount(selectedDifficulty, lvl)} Clues
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
