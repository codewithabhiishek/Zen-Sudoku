# Zen Sudoku 🧩

A modern, high-performance, and mathematical Sudoku application built with React 19, Vite, TypeScript, Tailwind CSS v4, TanStack Router, Drizzle ORM, and Neon PostgreSQL. Every puzzle generated is guaranteed to have **exactly one unique solution**, mathematically verified with logic-based technique rating.

---

## ✨ Features

- 🎯 **Guaranteed Unique Puzzles**: Puzzles are generated and verified via backtracking & MRV solvers to ensure a single valid solution every time.
- 📊 **Technique-Based Rating**: Difficulty levels (Easy, Medium, Hard, Expert) are classified by the hardest logical technique required (Naked/Hidden Singles, Pointing Pairs, Box-Line Reduction, Hidden Pairs, X-Wing).
- 🏆 **10 Levels Per Difficulty**: 40 distinct levels scaling smoothly from Starter to Grandmaster.
- 📱 **Full PWA & Mobile Optimization**:
  - Web App Manifest + 180×180 `apple-touch-icon` for iOS & Android "Add to Home Screen".
  - `touch-action: manipulation` & `-webkit-tap-highlight-color: transparent` to eliminate 300ms tap delay and touch highlights.
  - Prevents horizontal overscroll, text selection on fast grid taps, and iOS text input auto-zooming.
  - Responsive vertical space compression for short-screen mobile devices.
- 👤 **Guest & Cloud Profile System**: Seamless onboarding with zero passwords required. Generates a persistent UUID stored in `localStorage` and synchronized with Neon PostgreSQL, with Clerk user support.
- 📈 **Personal Statistics Page (`/stats`)**: Lifetime statistics including Win Rate %, ISO-standardized Current Streak Days with visual progress bars, Longest Streak, Best Solve Times per difficulty, replay-guarded XP calculation, and recent game moves.
- 🥇 **Global & Daily Leaderboards (`/leaderboard`)**: Real-time rankings filterable by period (*Global, Daily, Weekly, Monthly, All-Time*) and difficulty rating.
- 🎨 **6 Curated Visual Themes**:
  - ⬛ **Graphite**: Dark slate & soft indigo primary.
  - 🌲 **Forest Zen**: Deep emerald & mint green accents.
  - 🗼 **Tokyo Night**: Vibrant neon blue & Japanese night aesthetic.
  - ☕ **Catppuccin Mocha**: Cozy pastel violet & mocha tones.
  - ⚡ **AMOLED**: True pure black (`#000000`) mode optimized for OLED battery saving.
  - ♟️ **Chessboard Beige**: Warm paper & wooden print-puzzle aesthetic.
- ⌨️ **Full Desktop Keyboard Shortcuts**: Arrow Keys (Navigate), 1–9 (Input), Backspace/Delete (Erase), N (Notes), H (Hint), F (Fullscreen).
- 🔊 **Web Audio Synthesizer**: Client-side Web Audio API sounds for moves, mistakes, hints, and puzzle completions.
- ⏸️ **Auto-Pause & Progress Persistence**: State is automatically saved locally and synced to Neon PostgreSQL; timer automatically pauses when tab is backgrounded.

---

## 🛠️ Technology Stack

- **Frontend Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool & Router**: [Vite](https://vitejs.dev/), [TanStack Router](https://tanstack.com/router)
- **Styling & Icons**: [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Database & ORM**: [Neon PostgreSQL](https://neon.tech/) (Serverless), [Drizzle ORM](https://orm.drizzle.team/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) with localStorage persistence
- **Authentication**: [Clerk](https://clerk.com/)
- **Audio & Animations**: Web Audio API, CSS keyframes, Canvas Confetti

---

## ✅ Testing (E2E Playwright)

The application includes a comprehensive **Playwright End-to-End (E2E) test suite** with 14 automated tests covering core gameplay mechanics and infrastructure, including:
- **Authentication & Sessions**: Integrates official `@clerk/testing` to verify real authentication flows.
- **Cloud Auto-Save Sync**: Intercepts `neon.tech` SQL queries to prove instantaneous cloud saves.
- **Multi-Device Synchronization**: Simulates dual-browser tabs (Desktop/Phone) to verify seamless real-time syncing of active game sessions without race conditions.
- **Offline Resilience**: Simulates network drops and ensures that local moves correctly overwrite stale cloud data upon reconnection.
- **Logic & Progression**: Tests hints, mistakes, cell notes, progression locking (Level 1 to 10), and statistics accumulation across devices.

Run the test suite locally:
```bash
npm run test:e2e
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/codewithabhiishek/Zen-Sudoku.git

# Navigate into the directory
cd Zen-Sudoku

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

The app will be available locally at `http://localhost:5173`.

### Building for Production

```bash
# Generate static production build
npm run build

# Preview production build locally
npm run preview
```

---

## 👨‍💻 Author

Created with ❤️ by **[Abhishek](https://abhiishek-dev.vercel.app/)**  
Repository: **[Zen-Sudoku on GitHub](https://github.com/codewithabhiishek/Zen-Sudoku)**

---

## 📄 License

MIT License — feel free to use and customize for your own projects!
