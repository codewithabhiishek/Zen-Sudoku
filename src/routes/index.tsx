import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Board } from "@/components/sudoku/Board";
import { Keypad } from "@/components/sudoku/Keypad";
import { Controls, GameHeader } from "@/components/sudoku/Controls";
import { NewGameDialog } from "@/components/sudoku/NewGameDialog";
import { WinDialog } from "@/components/sudoku/WinDialog";
import { SettingsSheet } from "@/components/sudoku/SettingsSheet";
import { MoveExplanationModal } from "@/components/sudoku/MoveExplanationModal";
import { SubmitModal } from "@/components/sudoku/SubmitModal";
import { ZoomControls } from "@/components/sudoku/ZoomControls";
import { useGameStore } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";
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

  useEffect(() => setHydrated(true), []);

  // Apply theme class to <html>
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-crt", "theme-paper", "theme-contrast");
    if (theme !== "light") root.classList.add(`theme-${theme}`);
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
      <div className="mx-auto flex w-full max-w-[min(92vw,560px)] items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          {/* Animated Interactive Mini Sudoku Grid Logo */}
          <div className="grid size-8 grid-cols-2 grid-rows-2 gap-0.5 rounded-xl border bg-surface p-1 shadow-sm transition-transform hover:scale-105">
            <span className="mini-grid-dot-1 flex items-center justify-center rounded-[4px] font-mono text-[9px] font-bold">9</span>
            <span className="mini-grid-dot-2 flex items-center justify-center rounded-[4px] font-mono text-[9px] font-bold">4</span>
            <span className="mini-grid-dot-3 flex items-center justify-center rounded-[4px] font-mono text-[9px] font-bold">2</span>
            <span className="mini-grid-dot-4 flex items-center justify-center rounded-[4px] font-mono text-[9px] font-bold">7</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Zen Sudoku
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ZoomControls />
          <SettingsSheet />
        </div>
      </div>

      <GameHeader onNewGame={handleOpenNew} />
      <div className="my-3">
        <Board />
      </div>
      <div className="space-y-3">
        <Controls />
        <Keypad />
      </div>

      <p className="mx-auto mt-5 max-w-[min(92vw,560px)] text-center text-xs text-muted-foreground">
        Every puzzle is verified to have exactly one solution. Progress saves automatically.
      </p>

      {/* Abhishek Copyright Footer Credit */}
      <div className="mx-auto mt-4 flex w-full max-w-[min(92vw,560px)] items-center justify-center">
        <a
          href="https://github.com/codewithabhiishek"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-foreground backdrop-blur-sm transition-all hover:scale-105 hover:border-primary/50 hover:bg-primary/10 hover:shadow-md hover:shadow-primary/10"
        >
          <span className="text-muted-foreground">© 2026</span>
          <span className="display font-bold text-primary underline decoration-primary/40 underline-offset-2 transition-colors group-hover:text-primary">
            Abhishek
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="font-semibold text-foreground">Zen Sudoku</span>
        </a>
      </div>

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
