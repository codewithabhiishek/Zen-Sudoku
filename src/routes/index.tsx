import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart2, Trophy, User } from "lucide-react";
import { Board } from "@/components/sudoku/Board";
import { Keypad } from "@/components/sudoku/Keypad";
import { Controls, GameHeader } from "@/components/sudoku/Controls";
import { NewGameDialog } from "@/components/sudoku/NewGameDialog";
import { WinDialog } from "@/components/sudoku/WinDialog";
import { SettingsSheet } from "@/components/sudoku/SettingsSheet";
import { MoveExplanationModal } from "@/components/sudoku/MoveExplanationModal";
import { SubmitModal } from "@/components/sudoku/SubmitModal";
import { ZoomControls } from "@/components/sudoku/ZoomControls";
import { WelcomeModal } from "@/components/sudoku/WelcomeModal";
import { Footer } from "@/components/sudoku/Footer";
import { useGameStore } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useUserStore } from "@/store/userStore";
import type { Difficulty } from "@/lib/sudoku/types";

export const Route = createFileRoute("/")({
  component: SudokuPage,
});

function SudokuPage() {
  const theme = useSettingsStore((s) => s.theme);
  const puzzle = useGameStore((s) => s.puzzle);
  const running = useGameStore((s) => s.running);
  const won = useGameStore((s) => s.won);
  const newGame = useGameStore((s) => s.newGame);
  const resume = useGameStore((s) => s.resume);
  const pause = useGameStore((s) => s.pause);

  const [hydrated, setHydrated] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setHydrated(true);
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

  // Open dialog on first visit
  useEffect(() => {
    if (!hydrated) return;
    if (!puzzle) setDialogOpen(true);
  }, [hydrated, puzzle]);

  // BUG FIX: Auto-pause timer when tab is hidden, resume when visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        pause();
      } else {
        // Only resume if the game was actually running (not manually paused)
        const s = useGameStore.getState();
        if (s.running && !s.won) resume();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [pause, resume]);

  const handleNewGame = (d: Difficulty, level?: number) => {
    newGame(d, level);
    setDialogOpen(false);
  };

  const handleOpenNew = () => {
    if (puzzle && !won && running) resume();
    setDialogOpen(true);
  };

  return (
    <main
      className="min-h-dvh px-3 py-4 sm:py-6"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      {/* Responsive Mobile-First Header */}
      <header className="mx-auto flex w-full max-w-[min(92vw,560px)] flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        {/* Row 1 (Mobile) / Left (Desktop): Brand & Settings */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Animated Interactive Mini Sudoku Grid Logo */}
            <div className="grid size-8 shrink-0 grid-cols-2 grid-rows-2 gap-0.5 rounded-xl border bg-surface p-1 shadow-sm transition-transform hover:scale-105">
              <span className="mini-grid-dot-1 flex items-center justify-center rounded-[4px] font-mono text-[9px] font-bold">9</span>
              <span className="mini-grid-dot-2 flex items-center justify-center rounded-[4px] font-mono text-[9px] font-bold">4</span>
              <span className="mini-grid-dot-3 flex items-center justify-center rounded-[4px] font-mono text-[9px] font-bold">2</span>
              <span className="mini-grid-dot-4 flex items-center justify-center rounded-[4px] font-mono text-[9px] font-bold">7</span>
            </div>
            <h1 className="display text-3xl font-bold tracking-tight text-foreground whitespace-nowrap">
              Zen Sudoku
            </h1>
          </div>
          <div className="sm:hidden">
            <SettingsSheet />
          </div>
        </div>

        {/* Row 2 (Mobile) / Right (Desktop): Navigation Actions */}
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <div className="flex flex-1 items-center justify-between gap-2 sm:flex-none">
            <Link
              to="/profile"
              className="btn-interactive flex h-11 flex-1 sm:size-11 items-center justify-center rounded-md border bg-surface transition hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Profile"
              aria-label="Profile"
            >
              <User className="size-4" />
            </Link>
            <Link
              to="/stats"
              className="btn-interactive flex h-11 flex-1 sm:size-11 items-center justify-center rounded-md border bg-surface transition hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Statistics"
              aria-label="Statistics"
            >
              <BarChart2 className="size-4" />
            </Link>
            <Link
              to="/leaderboard"
              className="btn-interactive flex h-11 flex-1 sm:size-11 items-center justify-center rounded-md border bg-surface transition hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Leaderboards"
              aria-label="Leaderboards"
            >
              <Trophy className="size-4" />
            </Link>
            <div className="btn-interactive flex h-11 flex-1 sm:size-11 items-center justify-center rounded-md border bg-surface transition hover:bg-muted text-muted-foreground hover:text-foreground sm:ml-2">
              <ZoomControls />
            </div>
          </div>
          <div className="hidden sm:block sm:ml-2">
            <SettingsSheet />
          </div>
        </div>
      </header>

      <WelcomeModal />

      <GameHeader onNewGame={handleOpenNew} />
      <div className="my-3">
        <Board />
      </div>
      <div className="space-y-3">
        <Controls />
        <Keypad />
      </div>

      <Footer className="mt-6" />

      <NewGameDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onStart={handleNewGame}
        hasInProgress={!!puzzle && !won}
      />
      <WinDialog onNewGame={handleOpenNew} />
      <MoveExplanationModal />
      <SubmitModal />
    </main>
  );
}
