import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useGameStore } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";
import { getStatistics } from "@/database/api";
import { AnimatedNumber } from "@/components/sudoku/AnimatedNumber";
import { ArrowLeft, Trophy, Flame, Clock, Target, CheckCircle, BarChart3, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/stats")({
  component: StatsPage,
});

function fmtTime(sec?: number | null) {
  if (sec == null || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function StatsPage() {
  const theme = useSettingsStore((s) => s.theme);
  const localStats = useGameStore((s) => s.stats);
  const history = useGameStore((s) => s.history);
  const [dbStats, setDbStats] = useState<any>(null);

  // Apply theme
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
    document.title = "Personal Statistics • Zen Sudoku";
  }, [theme]);

  // Load async DB stats if available
  useEffect(() => {
    getStatistics("guest_user")
      .then((data) => {
        if (data) setDbStats(data);
      })
      .catch(() => {});
  }, []);

  const played = dbStats?.gamesPlayed ?? localStats.gamesPlayed ?? 0;
  const won = dbStats?.gamesWon ?? localStats.gamesWon ?? 0;
  const winRate = played > 0 ? Number(((won / played) * 100).toFixed(1)) : 0;
  const currentStreak = dbStats?.currentStreak ?? localStats.currentStreakDays ?? 0;
  const longestStreak = dbStats?.longestStreak ?? localStats.longestStreakDays ?? 0;

  const bestEasy = dbStats?.bestEasy ?? localStats.bestTimeByDifficulty.easy;
  const bestMedium = dbStats?.bestMedium ?? localStats.bestTimeByDifficulty.medium;
  const bestHard = dbStats?.bestHard ?? localStats.bestTimeByDifficulty.hard;
  const bestExpert = dbStats?.bestExpert ?? localStats.bestTimeByDifficulty.expert;

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
              <h1 className="display text-2xl sm:text-3xl font-bold tracking-tight">Personal Statistics</h1>
              <p className="text-xs text-muted-foreground">Detailed breakdown of your Sudoku mastery</p>
            </div>
          </div>
        </div>

        {/* Primary Overview Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            delayIndex={0}
            icon={<CheckCircle className="size-4 text-primary" />}
            label="Games Played"
            value={<AnimatedNumber value={played} />}
            subtext={`${won} Won`}
          />
          <StatCard
            delayIndex={1}
            icon={<Target className="size-4 text-emerald-500" />}
            label="Win Rate"
            value={<><AnimatedNumber value={winRate} />%</>}
            subtext="Accuracy"
          />
          <StatCard
            delayIndex={2}
            icon={<Flame className="size-4 text-orange-500" />}
            label="Current Streak"
            value={<><AnimatedNumber value={currentStreak} /> Days</>}
            visualBar={
              <div className="mt-1 flex gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-all duration-300",
                      i < (currentStreak % 7 || (currentStreak > 0 ? 7 : 0))
                        ? "bg-orange-500 shadow-xs"
                        : "bg-muted/40"
                    )}
                  />
                ))}
              </div>
            }
            subtext={`Best: ${longestStreak} Days`}
          />
          <StatCard
            delayIndex={3}
            icon={<Clock className="size-4 text-accent" />}
            label="Total Points"
            value={<AnimatedNumber value={localStats.totalPoints || 0} />}
            subtext="Lifetime XP"
          />
        </div>

        {/* Fastest Solve Times Section */}
        <div className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Trophy className="size-4 text-amber-500" /> Best Solve Times by Difficulty
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <BestTimeCard delayIndex={4} difficulty="Easy" time={bestEasy} color="border-emerald-500/30 text-emerald-500" />
            <BestTimeCard delayIndex={5} difficulty="Medium" time={bestMedium} color="border-blue-500/30 text-blue-500" />
            <BestTimeCard delayIndex={6} difficulty="Hard" time={bestHard} color="border-amber-500/30 text-amber-500" />
            <BestTimeCard delayIndex={7} difficulty="Expert" time={bestExpert} color="border-rose-500/30 text-rose-500" />
          </div>
        </div>

        {/* Performance Insights */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="card-interactive animate-card-entry rounded-xl border bg-surface p-5 shadow-sm" style={{ animationDelay: "320ms" }}>
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
              <BarChart3 className="size-4 text-primary" /> Performance Summary
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Total Moves Tracked</span>
                <span className="font-semibold tabular-nums"><AnimatedNumber value={history.length} /></span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Longest Streak Record</span>
                <span className="font-semibold tabular-nums">{longestStreak} Days</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-muted-foreground">Current Active Session</span>
                <span className="font-semibold text-emerald-500">Active</span>
              </div>
            </div>
          </div>

          <div className="card-interactive animate-card-entry rounded-xl border bg-surface p-5 shadow-sm" style={{ animationDelay: "360ms" }}>
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
              <AlertCircle className="size-4 text-amber-500" /> Mastery Insights
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Your win rate is <span className="font-bold text-foreground">{winRate}%</span>. Keep playing daily challenges to increase your streak multiplier and rank higher on the global leaderboard!
            </p>
          </div>
        </div>

        {/* Recent Games List */}
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Activity</h2>
          {history.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-surface/50 p-8 text-center text-sm text-muted-foreground">
              No recent game moves recorded yet. Start a new puzzle to build your history!
            </div>
          ) : (
            <div className="card-interactive animate-card-entry rounded-xl border bg-surface overflow-hidden shadow-sm" style={{ animationDelay: "400ms" }}>
              <div className="p-4 border-b bg-surface-2/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex justify-between">
                <span>Recent Moves Tracked</span>
                <span>{history.length} Moves Recorded</span>
              </div>
              <div className="divide-y max-h-60 overflow-y-auto">
                {history.slice(-10).reverse().map((move, idx) => (
                  <div key={idx} className="p-3 text-xs flex justify-between items-center hover:bg-muted/40 transition">
                    <span className="text-muted-foreground">Cell ({Math.floor(move.idx / 9)}, {move.idx % 9})</span>
                    <span className="font-semibold text-primary">Digit {move.next.value || "Erased"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  delayIndex,
  icon,
  label,
  value,
  visualBar,
  subtext,
}: {
  delayIndex: number;
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  visualBar?: React.ReactNode;
  subtext: string;
}) {
  return (
    <div
      className="card-interactive animate-card-entry rounded-xl border bg-surface p-4 shadow-sm"
      style={{ animationDelay: `${delayIndex * 40}ms` }}
    >
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="display text-2xl font-bold tracking-tight">{value}</div>
      {visualBar}
      <div className="mt-1 text-[11px] text-muted-foreground">{subtext}</div>
    </div>
  );
}

function BestTimeCard({ delayIndex, difficulty, time, color }: { delayIndex: number; difficulty: string; time?: number | null; color: string }) {
  return (
    <div
      className={cn("card-interactive animate-card-entry rounded-xl border bg-surface p-4 shadow-sm", color.split(" ")[0])}
      style={{ animationDelay: `${delayIndex * 40}ms` }}
    >
      <div className={cn("text-xs font-bold uppercase tracking-wider", color.split(" ")[1])}>{difficulty}</div>
      <div className="mt-2 display text-xl font-bold tabular-nums">{fmtTime(time)}</div>
    </div>
  );
}
