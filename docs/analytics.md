# Zen Sudoku — Analytics Documentation

This project uses **Vercel Analytics** (`@vercel/analytics`) and **Vercel Speed Insights** (`@vercel/speed-insights`) for free, lightweight telemetry and Web Vitals monitoring.

---

## Architecture Overview

All custom event tracking is centralized in [`src/lib/analytics.ts`](../src/lib/analytics.ts).
No UI component calls Vercel's `track()` directly. All analytics operations are wrapped in safe `try/catch` blocks (`safeTrack`), ensuring analytics errors never crash or interrupt gameplay.

- **Root Integration**: Mounted in [`src/main.tsx`](../src/main.tsx) via `<Analytics />` and `<SpeedInsights />`.
- **Web Vitals**: Tracked automatically by `<SpeedInsights />` (LCP, INP, CLS, FCP, TTFB).
- **Custom Events**: Triggered exclusively from state actions, user interactions, or completed game events.

---

## Event Catalog

| Event Name | Trigger Location | Description | Event Properties |
| :--- | :--- | :--- | :--- |
| **`Game Started`** | `gameStore.newGame()` | Triggered when a player starts a new game session. | `difficulty` *(string)* |
| **`Game Completed`** | `gameStore.applyWinToStats()` | Triggered exactly once when a puzzle is successfully solved. | `difficulty` *(string)*<br>`solveTimeSeconds` *(number)*<br>`mistakes` *(number)*<br>`hintsUsed` *(number)*<br>`undoCount` *(number)*<br>`notesUsed` *(boolean)*<br>`autoRemoveIncorrect` *(boolean)* |
| **`New Puzzle`** | `gameStore.newGame()` | Triggered when a new puzzle layout is initialized. | `difficulty` *(string)* |
| **`Difficulty Selected`** | `NewGameDialog` / `src/routes/index.tsx` | Triggered when the user switches difficulty tabs (Easy, Medium, Hard, Expert). | `difficulty` *(string)* |
| **`Hint Used`** | `gameStore.hint()` | Triggered when a player requests a logical hint. | `difficulty` *(string)* |
| **`Undo Used`** | `gameStore.undo()` | Triggered when a player undoes a move. | `difficulty` *(string)* |
| **`Notes Mode Toggled`** | `gameStore.toggleNotes()` | Triggered when pencil notes mode is enabled or disabled. | `enabled` *(boolean)* |
| **`Theme Changed`** | `settingsStore.setTheme()` | Triggered when a user switches the color palette theme. | `theme` *(string)* |
| **`Statistics Viewed`** | `src/routes/stats.tsx` | Triggered when the user navigates to the Personal Statistics route (`/stats`). | *None* |
| **`Leaderboard Viewed`** | `src/routes/leaderboard.tsx` | Triggered when the user navigates to the Leaderboard route (`/leaderboard`). | *None* |
| **`Daily Challenge Started`** | `trackDailyChallengeStarted()` | Triggered when a player launches a daily challenge puzzle. | `date` *(string)* |
| **`Daily Challenge Completed`** | `trackDailyChallengeCompleted()` | Triggered when a daily challenge puzzle is completed. | `solveTimeSeconds` *(number)*<br>`mistakes` *(number)* |

---

## How to Verify Events in Vercel Analytics Dashboard

1. **Deploy to Vercel**:
   Push changes to `main` branch or create a preview deployment on Vercel.

2. **Enable Analytics in Vercel Dashboard**:
   - Open your project in the [Vercel Dashboard](https://vercel.com/dashboard).
   - Navigate to the **Analytics** tab and click **Enable Analytics** (Free tier).
   - Navigate to the **Speed Insights** tab and click **Enable Speed Insights**.

3. **Real-time Event Verification**:
   - Open the live site in your browser.
   - Perform user actions (e.g., start a game, solve a puzzle, toggle notes, switch theme to "Tokyo Night", view Statistics).
   - In the Vercel Analytics dashboard, select **Custom Events**.
   - You will see live events like `Game Completed`, `Theme Changed`, `Hint Used` along with property breakdowns (e.g., `difficulty: "easy"`, `solveTimeSeconds: 142`).
