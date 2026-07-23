import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart2, Trophy, User, ChevronRight, CheckCircle2, Flame, ShieldAlert, Zap, Sparkles, Layers, Play, Clock, Flame as StreakIcon } from "lucide-react";
import { SettingsSheet } from "@/components/sudoku/SettingsSheet";
import { ZoomControls } from "@/components/sudoku/ZoomControls";
import { Footer } from "@/components/sudoku/Footer";
import { useGameStore } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useUserStore } from "@/store/userStore";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/clerk-react";
import { trackDifficultySelected } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/sudoku/types";

export const Route = createFileRoute("/")({
  component: HomePage,
});

type ThemeId = import("@/store/settingsStore").ThemeId;

function getClueCount(d: Difficulty, level: number): number {
  const step = Math.min(9, Math.max(0, level - 1));
  switch (d) {
    case "easy":   return Math.max(34, 42 - Math.floor(step * 0.8));
    case "medium": return Math.max(28, 35 - Math.floor(step * 0.8));
    case "hard":   return Math.max(22, 28 - Math.floor(step * 0.7));
    case "expert": return Math.max(17, 23 - Math.floor(step * 0.6));
  }
}

function fmt(ms: number) {
  const t = Math.floor(ms / 1000);
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const DIFFICULTIES: { id: Difficulty; label: string; desc: string; color: string }[] = [
  { id: "easy",   label: "Easy",   desc: "Naked & Hidden Singles",   color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { id: "medium", label: "Medium", desc: "Pointing Pairs & Subsets", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  { id: "hard",   label: "Hard",   desc: "Box-Line & Hidden Pairs",  color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { id: "expert", label: "Expert", desc: "X-Wing & Advanced Trial",  color: "text-rose-400 border-rose-500/30 bg-rose-500/10" },
];

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const LEVEL_TAGS: Record<number, { name: string; tagColor: string }> = {
  1: { name: "Starter",     tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  2: { name: "Rookie",      tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  3: { name: "Novice",      tagColor: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  4: { name: "Skilled",     tagColor: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  5: { name: "Pro",         tagColor: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  6: { name: "Advanced",    tagColor: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  7: { name: "Hardcore",    tagColor: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  8: { name: "Extreme",     tagColor: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  9: { name: "Master",      tagColor: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  10: { name: "Grandmaster", tagColor: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
};

function HomePage() {
  const theme = useSettingsStore((s) => s.theme);
  const puzzle = useGameStore((s) => s.puzzle);
  const running = useGameStore((s) => s.running);
  const won = useGameStore((s) => s.won);
  const paused = useGameStore((s) => s.paused);
  const elapsedMs = useGameStore((s) => s.elapsedMs);
  const cells = useGameStore((s) => s.cells);
  const newGame = useGameStore((s) => s.newGame);
  const resume = useGameStore((s) => s.resume);
  const stats = useGameStore((s) => s.stats);
  const completedLevels = stats.completedLevels ?? [];

  const navigate = useNavigate();
  const [selectedDiff, setSelectedDiff] = useState<Difficulty>("easy");
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    useUserStore.getState().initUser();
  }, []);

  // Apply theme class to <html>
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("theme-graphite","theme-forest","theme-tokyo","theme-catppuccin","theme-amoled","theme-chessboard");
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  useEffect(() => {
    document.title = "Zen Sudoku — Home";
  }, []);

  const hasInProgress = !!puzzle && !won && (running || paused);

  // Count cells filled
  const filledCells = cells.filter((c) => c.value !== 0 && !c.given).length;
  const totalEmpty = cells.filter((c) => !c.given).length;
  const progressPct = totalEmpty > 0 ? Math.round((filledCells / totalEmpty) * 100) : 0;

  const pickLevel = async (d: Difficulty, level: number) => {
    const key = `${d}-${level}`;
    setLoading(key);
    await new Promise((r) => setTimeout(r, 20));
    newGame(d, level);
    setLoading(null);
    navigate({ to: "/game" });
  };

  const handleResume = () => {
    if (paused) resume();
    navigate({ to: "/game" });
  };

  const activeDiff = DIFFICULTIES.find((d) => d.id === selectedDiff)!;
  const completedForDiff = (d: Difficulty) => completedLevels.filter((k) => k.startsWith(`${d}-`)).length;

  return (
    <main
      className="flex min-h-dvh flex-col"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))", paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      {/* ── TOP NAV ─────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-2xl px-4 pt-3 sm:pt-5">
        <header className="flex w-full items-center justify-between pb-4 sm:pb-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 shrink-0 grid-cols-2 grid-rows-2 gap-0.5 rounded-lg border bg-surface p-1 shadow-xs">
              <span className="mini-grid-dot-1 flex items-center justify-center rounded-[3px] font-mono text-[9px] font-bold">9</span>
              <span className="mini-grid-dot-2 flex items-center justify-center rounded-[3px] font-mono text-[9px] font-bold">4</span>
              <span className="mini-grid-dot-3 flex items-center justify-center rounded-[3px] font-mono text-[9px] font-bold">2</span>
              <span className="mini-grid-dot-4 flex items-center justify-center rounded-[3px] font-mono text-[9px] font-bold">7</span>
            </div>
            <h1 className="display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Zen Sudoku
            </h1>
          </div>

          {/* Nav toolbar */}
          <div className="flex items-center gap-0.5 sm:gap-1 rounded-xl border bg-surface p-1 shadow-sm">
            <Link to="/profile" className="btn-interactive grid size-8 sm:size-9 place-items-center rounded-lg transition hover:bg-muted text-muted-foreground hover:text-foreground" title="Profile" aria-label="Profile">
              <User className="size-4" />
            </Link>
            <Link to="/stats" className="btn-interactive grid size-8 sm:size-9 place-items-center rounded-lg transition hover:bg-muted text-muted-foreground hover:text-foreground" title="Statistics" aria-label="Statistics">
              <BarChart2 className="size-4" />
            </Link>
            <Link to="/leaderboard" className="btn-interactive grid size-8 sm:size-9 place-items-center rounded-lg transition hover:bg-muted text-muted-foreground hover:text-foreground" title="Leaderboards" aria-label="Leaderboards">
              <Trophy className="size-4" />
            </Link>
            <div className="hidden sm:block"><ZoomControls /></div>
            <SettingsSheet />
          </div>
        </header>

        {/* ── CONTINUE BANNER ─────────────────────────────────── */}
        {hasInProgress && (
          <button
            onClick={handleResume}
            className="group mb-5 w-full rounded-2xl border border-primary/30 bg-primary/5 p-4 text-left transition hover:bg-primary/10 hover:border-primary/50 active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Play className="size-5 fill-current" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground flex items-center gap-2">
                    Continue Game
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary capitalize">
                      {puzzle!.difficulty}{puzzle!.levelNumber ? ` · L${puzzle!.levelNumber}` : ""}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" /> {fmt(elapsedMs)}
                    </span>
                    <span>{progressPct}% complete</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 w-48 max-w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold text-primary transition group-hover:translate-x-1">
                Resume <ChevronRight className="size-4" />
              </div>
            </div>
          </button>
        )}

        {/* ── PROGRESS OVERVIEW ───────────────────────────────── */}
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DIFFICULTIES.map((d) => {
            const done = completedForDiff(d.id);
            const pct = Math.round((done / 10) * 100);
            return (
              <button
                key={d.id}
                onClick={() => {
                  setSelectedDiff(d.id);
                  trackDifficultySelected(d.id);
                }}
                className={cn(
                  "rounded-xl border p-3 text-left transition hover:scale-[1.02] active:scale-[0.99]",
                  selectedDiff === d.id ? "border-primary/50 bg-primary/5" : "bg-surface hover:bg-surface-2",
                )}
              >
                <div className={cn("text-xs font-bold mb-1", d.color.split(" ")[0])}>{d.label}</div>
                <div className="text-lg font-bold tabular-nums text-foreground">{done}<span className="text-xs font-normal text-muted-foreground">/10</span></div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </button>
            );
          })}
        </div>

        {/* ── LEVEL SELECTOR ──────────────────────────────────── */}
        <div className="rounded-2xl border bg-surface p-4 shadow-sm">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Layers className="size-4" />
              </div>
              <div>
                <h2 className="display text-base font-bold">Select Level</h2>
                <p className="text-[11px] text-muted-foreground">10 levels per difficulty</p>
              </div>
            </div>
          </div>

          {/* Difficulty Tabs */}
          <div className="mb-4 grid grid-cols-4 gap-1.5 rounded-xl bg-muted/40 p-1.5 border">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setSelectedDiff(d.id);
                  trackDifficultySelected(d.id);
                }}
                className={cn(
                  "rounded-lg py-2 text-xs font-bold transition-all text-center",
                  selectedDiff === d.id
                    ? "bg-surface text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Sub-header */}
          <div className="mb-3 flex items-center justify-between rounded-xl border bg-muted/20 px-3.5 py-2 text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" /> {activeDiff.label} Tier
            </span>
            <span className="text-muted-foreground">{activeDiff.desc}</span>
          </div>

          {/* Level List */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {LEVELS.map((lvl) => {
              const key = `${selectedDiff}-${lvl}`;
              const isLoadingThis = loading === key;
              const tag = LEVEL_TAGS[lvl];
              const isDone = completedLevels.includes(key);

              return (
                <button
                  key={lvl}
                  onClick={() => pickLevel(selectedDiff, lvl)}
                  disabled={loading !== null}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all disabled:opacity-50 active:scale-[0.99]",
                    isDone
                      ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
                      : "bg-surface-2 hover:border-primary/50 hover:bg-highlight/50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "grid size-9 place-items-center rounded-xl font-mono font-bold text-xs border shrink-0",
                      isDone ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : activeDiff.color,
                    )}>
                      {isDone ? <CheckCircle2 className="size-4" /> : `L${lvl}`}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground flex items-center gap-2">
                        Level {lvl}
                        {isDone ? (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold border flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            <CheckCircle2 className="size-2.5" /> Complete
                          </span>
                        ) : (
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold border flex items-center gap-1", tag.tagColor)}>
                            {lvl >= 9 ? <Flame className="size-2.5" /> : lvl >= 7 ? <ShieldAlert className="size-2.5" /> : <Zap className="size-2.5" />}
                            {tag.name}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {activeDiff.label} • {getClueCount(selectedDiff, lvl)} Clues
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-semibold transition group-hover:translate-x-1",
                    isDone ? "text-emerald-400" : "text-primary",
                  )}>
                    {isLoadingThis ? "Loading..." : isDone ? "Play Again" : "Play"} <ChevronRight className="size-4" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── QUICK STATS ─────────────────────────────────────── */}
        <div className="mt-4 flex items-center justify-center gap-6 rounded-xl border bg-surface px-4 py-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-semibold">
            <StreakIcon className="size-3.5 text-orange-400" />
            <span className="text-foreground">{stats.currentStreakDays}</span>-day streak
          </span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-1.5 font-semibold">
            ★ <span className="text-foreground">{stats.totalPoints.toLocaleString()}</span> pts
          </span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="text-foreground">{stats.gamesWon}</span> won
          </span>
        </div>
      </div>

      <Footer className="mt-6 flex" />
    </main>
  );
}
