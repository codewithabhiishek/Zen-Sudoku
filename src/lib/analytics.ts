import { track } from "@vercel/analytics";

/**
 * Safely wraps Vercel's track() API to ensure analytics calls never throw
 * or break gameplay execution.
 */
function safeTrack(eventName: string, properties?: Record<string, string | number | boolean>) {
  try {
    track(eventName, properties);
  } catch (err) {
    // Silently ignore errors to guarantee gameplay continuity
  }
}

export function trackGameStarted(difficulty: string) {
  safeTrack("Game Started", { difficulty });
}

export function trackGameCompleted(props: {
  difficulty: string;
  solveTimeSeconds: number;
  mistakes: number;
  hintsUsed: number;
  undoCount: number;
  notesUsed: boolean;
  autoRemoveIncorrect: boolean;
}) {
  safeTrack("Game Completed", props);
}

export function trackNewPuzzle(difficulty: string) {
  safeTrack("New Puzzle", { difficulty });
}

export function trackDifficultySelected(difficulty: string) {
  safeTrack("Difficulty Selected", { difficulty });
}

export function trackHintUsed(difficulty: string) {
  safeTrack("Hint Used", { difficulty });
}

export function trackUndoUsed(difficulty: string) {
  safeTrack("Undo Used", { difficulty });
}

export function trackNotesMode(enabled: boolean) {
  safeTrack("Notes Mode Toggled", { enabled });
}

export function trackThemeChanged(theme: string) {
  safeTrack("Theme Changed", { theme });
}

export function trackStatisticsViewed() {
  safeTrack("Statistics Viewed");
}

export function trackLeaderboardViewed() {
  safeTrack("Leaderboard Viewed");
}

export function trackDailyChallengeStarted(date: string) {
  safeTrack("Daily Challenge Started", { date });
}

export function trackDailyChallengeCompleted(props: { solveTimeSeconds: number; mistakes: number }) {
  safeTrack("Daily Challenge Completed", props);
}
