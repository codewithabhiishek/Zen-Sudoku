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
  head: () => ({
    meta: [
      { title: "Zen Sudoku" },
      {
        name: "description",
        content:
          "A polished Sudoku with logic-rated difficulty, notes, hints, five themes, and offline play. Every puzzle is verified to have exactly one solution.",
      },
      { property: "og:title", content: "Zen Sudoku" },
      {
        property: "og:description",
        content: "Logic-rated difficulty, notes, hints, and five themes. Offline-ready.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SudokuPage,
});

function SudokuPage() {
  const theme = useSettingsStore((s) => s.theme);
  const puzzle = useGameStore((s) => s.puzzle);
  const running = useGameStore((s) => s.running);
  const won = useGameStore((s) => s.won);
  const newGame = useGameStore((s) => s.newGame);
  const resume = useGameStore((s) => s.resume);

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

  // Open dialog on first visit
  useEffect(() => {
    if (!hydrated) return;
    if (!puzzle) setDialogOpen(true);
  }, [hydrated, puzzle]);

  const handleNewGame = (d: Difficulty, level?: number) => {
    newGame(d, level);
    setDialogOpen(false);
  };

  const handleOpenNew = () => {
    if (puzzle && !won && running) resume();
    setDialogOpen(true);
  };

  return (
    <main className="min-h-dvh px-3 py-4 sm:py-6">
      <div className="mx-auto flex w-full max-w-[min(92vw,560px)] items-center justify-between pb-2">
        <h1 className="display text-2xl">Zen Sudoku</h1>
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

      <p className="mx-auto mt-6 max-w-[min(92vw,560px)] text-center text-xs text-muted-foreground">
        Every puzzle is verified to have exactly one solution. Progress saves automatically.
      </p>

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
