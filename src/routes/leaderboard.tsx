import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSettingsStore } from "@/store/settingsStore";
import { getLeaderboard } from "@/database/api";
import { ArrowLeft, Trophy, Medal, User, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
});

export interface LeaderboardItem {
  id: string;
  userId: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  difficulty: string;
  score: number;
  time: number;
  mistakes: number;
  createdAt: string | Date;
}

type Period = "global" | "daily" | "weekly" | "monthly" | "all_time";
type DiffFilter = "all" | "easy" | "medium" | "hard" | "expert";

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function LeaderboardPage() {
  const theme = useSettingsStore((s) => s.theme);
  const [period, setPeriod] = useState<Period>("global");
  const [difficulty, setDifficulty] = useState<DiffFilter>("all");
  const [entries, setEntries] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply current theme
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove(
      "theme-graphite",
      "theme-forest",
      "theme-tokyo",
      "theme-catppuccin",
      "theme-amoled",
      "theme-chessboard"
    );
    root.classList.add(`theme-${theme}`);
    document.title = "Leaderboards • Zen Sudoku";
  }, [theme]);

  // Fetch leaderboard data from Neon PostgreSQL database
  useEffect(() => {
    setLoading(true);
    const diffArg = difficulty === "all" ? undefined : difficulty;
    getLeaderboard(diffArg, 50)
      .then((data) => {
        setEntries((data as LeaderboardItem[]) || []);
      })
      .catch((err) => {
        console.error("Leaderboard fetch error:", err);
        setEntries([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [period, difficulty]);

  return (
    <div className="min-h-dvh bg-background text-foreground transition-colors animate-page-enter">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        {/* Top Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="btn-interactive grid size-10 place-items-center rounded-lg border bg-surface text-muted-foreground transition hover:bg-muted hover:text-foreground"
              title="Back to Game"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <h1 className="display text-2xl sm:text-3xl font-bold tracking-tight">Leaderboards</h1>
              <p className="text-xs text-muted-foreground">Top Zen Sudoku players around the world</p>
            </div>
          </div>
        </div>

        {/* Time Period Tabs */}
        <div className="mb-4 flex flex-wrap gap-1.5 rounded-xl border bg-surface p-1.5 shadow-sm">
          {(["global", "daily", "weekly", "monthly", "all_time"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setPeriod(tab)}
              className={cn(
                "btn-interactive flex-1 rounded-lg px-3 py-2 text-xs font-semibold capitalize transition",
                period === tab
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Difficulty Filter Buttons */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Difficulty:</span>
          {(["all", "easy", "medium", "hard", "expert"] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficulty(diff)}
              className={cn(
                "btn-interactive rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition",
                difficulty === diff
                  ? "border-primary bg-highlight-strong text-foreground ring-1 ring-primary"
                  : "border-border bg-surface text-muted-foreground hover:bg-muted"
              )}
            >
              {diff}
            </button>
          ))}
        </div>

        {/* Leaderboard Table / Cards */}
        {loading ? (
          <div className="rounded-2xl border bg-surface p-12 text-center text-sm text-muted-foreground shadow-sm">
            <div className="inline-block size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-3">Loading leaderboards...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-surface/50 p-12 text-center shadow-sm">
            <Trophy className="mx-auto size-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-semibold">No leaderboard entries yet.</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Be the first player to complete a puzzle and set the record!
            </p>
            <div className="mt-5">
              <Link
                to="/"
                className="btn-interactive inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Play Now
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-surface overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="grid grid-cols-12 border-b bg-surface-2/60 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <div className="col-span-2 sm:col-span-1 text-center">Rank</div>
              <div className="col-span-5 sm:col-span-5">Player</div>
              <div className="col-span-2 sm:col-span-2 text-center">Difficulty</div>
              <div className="col-span-3 sm:col-span-2 text-right">Time</div>
              <div className="hidden sm:block sm:col-span-2 text-right">Score</div>
            </div>

            {/* Rows */}
            <div className="divide-y">
              {entries.map((item, idx) => {
                const rank = idx + 1;
                const name = item.displayName || item.username || `Player #${item.userId?.slice(-4) || rank}`;

                return (
                  <div
                    key={item.id || idx}
                    style={{ animationDelay: `${idx * 25}ms` }}
                    className="animate-card-entry grid grid-cols-12 items-center px-4 py-3.5 text-sm transition hover:bg-muted/40"
                  >
                    {/* Rank */}
                    <div className="col-span-2 sm:col-span-1 flex justify-center">
                      {rank === 1 ? (
                        <div className="flex size-7 items-center justify-center rounded-full bg-amber-500/20 text-amber-500 font-bold text-xs">
                          🥇 1
                        </div>
                      ) : rank === 2 ? (
                        <div className="flex size-7 items-center justify-center rounded-full bg-slate-400/20 text-slate-300 font-bold text-xs">
                          🥈 2
                        </div>
                      ) : rank === 3 ? (
                        <div className="flex size-7 items-center justify-center rounded-full bg-amber-700/20 text-amber-600 font-bold text-xs">
                          🥉 3
                        </div>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground">#{rank}</span>
                      )}
                    </div>

                    {/* Player Info */}
                    <div className="col-span-5 sm:col-span-5 flex items-center gap-2.5 min-w-0">
                      <div className="grid size-8 shrink-0 place-items-center rounded-full border bg-surface-2 text-muted-foreground">
                        {item.avatarUrl ? (
                          <img src={item.avatarUrl} alt={name} className="size-full rounded-full object-cover" />
                        ) : (
                          <User className="size-4" />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold truncate text-foreground text-xs sm:text-sm">{name}</div>
                        {item.mistakes > 0 && (
                          <div className="text-[10px] text-muted-foreground">
                            {item.mistakes} {item.mistakes === 1 ? "mistake" : "mistakes"}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Difficulty Badge */}
                    <div className="col-span-2 sm:col-span-2 text-center">
                      <span
                        className={cn(
                          "inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          item.difficulty === "easy" && "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
                          item.difficulty === "medium" && "bg-blue-500/10 text-blue-500 border border-blue-500/20",
                          item.difficulty === "hard" && "bg-amber-500/10 text-amber-500 border border-amber-500/20",
                          item.difficulty === "expert" && "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                        )}
                      >
                        {item.difficulty}
                      </span>
                    </div>

                    {/* Time */}
                    <div className="col-span-3 sm:col-span-2 text-right font-mono text-xs font-semibold tabular-nums">
                      {fmtTime(item.time)}
                    </div>

                    {/* Score */}
                    <div className="hidden sm:block sm:col-span-2 text-right font-mono text-xs font-bold text-primary tabular-nums">
                      {item.score.toLocaleString()} pts
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
