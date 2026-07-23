import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BarChart2, Trophy, User, Home } from "lucide-react";
import { Board } from "@/components/sudoku/Board";
import { Keypad } from "@/components/sudoku/Keypad";
import { Controls, GameHeader } from "@/components/sudoku/Controls";
import { WinDialog } from "@/components/sudoku/WinDialog";
import { SettingsSheet } from "@/components/sudoku/SettingsSheet";
import { MoveExplanationModal } from "@/components/sudoku/MoveExplanationModal";
import { SubmitModal } from "@/components/sudoku/SubmitModal";
import { ZoomControls } from "@/components/sudoku/ZoomControls";
import { Footer } from "@/components/sudoku/Footer";
import { useGameStore } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useUserStore } from "@/store/userStore";

export const Route = createFileRoute("/game")({
  component: GamePage,
});

function GamePage() {
  const theme = useSettingsStore((s) => s.theme);
  const puzzle = useGameStore((s) => s.puzzle);
  const running = useGameStore((s) => s.running);
  const won = useGameStore((s) => s.won);
  const pause = useGameStore((s) => s.pause);
  const resume = useGameStore((s) => s.resume);
  const reset = useGameStore((s) => s.reset);

  const navigate = useNavigate();

  useEffect(() => {
    useUserStore.getState().initUser();
  }, []);

  // Apply theme class to <html>
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove(
      "theme-graphite",
      "theme-forest",
      "theme-tokyo",
      "theme-catppuccin",
      "theme-amoled",
      "theme-chessboard",
    );
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  // Set page title
  useEffect(() => {
    document.title = "Zen Sudoku";
  }, []);

  // Redirect to home if no puzzle loaded (e.g. direct URL visit)
  useEffect(() => {
    if (!puzzle && !running) {
      navigate({ to: "/" });
    }
  }, [puzzle, running, navigate]);

  // Auto-pause timer when tab is hidden, resume when visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        pause();
      } else {
        const s = useGameStore.getState();
        if (s.running && !s.won) resume();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [pause, resume]);

  // Go home: pause the game and navigate to /
  const handleGoHome = () => {
    if (running && !won) pause();
    navigate({ to: "/" });
  };

  // After winning: go home so the player can pick the next level there
  const handleAfterWin = () => {
    reset();
    navigate({ to: "/" });
  };

  return (
    <main
      className="flex min-h-dvh flex-col justify-between px-3 py-2 sm:py-6"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))", paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      <div className="mx-auto flex w-full max-w-[min(92vw,560px)] flex-col gap-1.5 sm:gap-3">
        {/* Single-Row Mobile Header */}
        <header className="flex w-full items-center justify-between pb-1 sm:pb-2">
          {/* Brand Logo & Title — click goes home */}
          <button
            onClick={handleGoHome}
            className="flex items-center gap-2.5 overflow-hidden group"
            title="Back to Home"
            aria-label="Back to Home"
          >
            <div className="grid size-7 shrink-0 grid-cols-2 grid-rows-2 gap-0.5 rounded-lg border bg-surface p-0.5 shadow-xs sm:size-8 sm:p-1 group-hover:border-primary/50 transition">
              <span className="mini-grid-dot-1 flex items-center justify-center rounded-[3px] font-mono text-[8px] sm:text-[9px] font-bold">9</span>
              <span className="mini-grid-dot-2 flex items-center justify-center rounded-[3px] font-mono text-[8px] sm:text-[9px] font-bold">4</span>
              <span className="mini-grid-dot-3 flex items-center justify-center rounded-[3px] font-mono text-[8px] sm:text-[9px] font-bold">2</span>
              <span className="mini-grid-dot-4 flex items-center justify-center rounded-[3px] font-mono text-[8px] sm:text-[9px] font-bold">7</span>
            </div>
            <h1 className="display text-xl leading-none sm:text-3xl font-bold tracking-tight text-foreground whitespace-nowrap group-hover:text-primary transition">
              Zen Sudoku
            </h1>
          </button>

          {/* Shared Unified Navigation Toolbar Card */}
          <div className="flex items-center gap-0.5 sm:gap-1 rounded-xl border bg-surface p-1 shadow-sm">
            <button
              onClick={handleGoHome}
              className="btn-interactive grid size-8 sm:size-9 place-items-center rounded-lg transition hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Home"
              aria-label="Home"
            >
              <Home className="size-4" />
            </button>
            <Link
              to="/profile"
              className="btn-interactive grid size-8 sm:size-9 place-items-center rounded-lg transition hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Profile"
              aria-label="Profile"
            >
              <User className="size-4" />
            </Link>
            <Link
              to="/stats"
              className="btn-interactive grid size-8 sm:size-9 place-items-center rounded-lg transition hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Statistics"
              aria-label="Statistics"
            >
              <BarChart2 className="size-4" />
            </Link>
            <Link
              to="/leaderboard"
              className="btn-interactive grid size-8 sm:size-9 place-items-center rounded-lg transition hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Leaderboards"
              aria-label="Leaderboards"
            >
              <Trophy className="size-4" />
            </Link>
            <div className="hidden sm:block">
              <ZoomControls />
            </div>
            <SettingsSheet />
          </div>
        </header>

        <GameHeader onNewGame={handleGoHome} />

        <div className="my-1 sm:my-3">
          <Board />
        </div>

        <div className="space-y-2 sm:space-y-3">
          <Controls />
          <Keypad />
        </div>
      </div>

      <Footer className="mt-4 hidden sm:flex" />

      <WinDialog onNewGame={handleAfterWin} />
      <MoveExplanationModal />
      <SubmitModal />
    </main>
  );
}
