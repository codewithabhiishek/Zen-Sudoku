# Zen Sudoku 🧩

A modern, high-performance, and mathematical Sudoku application built with React 19, Vite, TypeScript, Tailwind CSS v4, TanStack Router, Drizzle ORM, and Neon PostgreSQL. Every puzzle generated is guaranteed to have **exactly one unique solution**, mathematically verified with logic-based technique rating.

---

## ✨ Features

- 🎯 **Guaranteed Unique Puzzles**: Puzzles are generated and verified via backtracking & MRV solvers to ensure a single valid solution every time.
- 📊 **Technique-Based Rating**: Difficulty levels (Easy, Medium, Hard, Expert) are classified by the hardest logical technique required (Naked/Hidden Singles, Pointing Pairs, Box-Line Reduction, Hidden Pairs, X-Wing).
- 🏆 **10 Levels Per Difficulty**: 40 distinct levels scaling smoothly from Starter to Grandmaster.
- 👤 **Guest Profile System**: Seamless onboarding with zero passwords or email required. Generates a persistent UUID stored in `localStorage` and synchronized with Neon PostgreSQL.
- 📈 **Personal Statistics Page (`/stats`)**: Lifetime statistics including Win Rate %, Current Streak Days, Longest Streak, Best Solve Times per difficulty, total XP, and recent game moves.
- 🥇 **Global & Daily Leaderboards (`/leaderboard`)**: Real-time rankings filterable by period (*Global, Daily, Weekly, Monthly, All-Time*) and difficulty rating.
- 🎨 **Multiple Visual Themes**:
  - **AMOLED**: True dark mode for OLED screens.
  - **Midnight**: Deep blue executive theme.
  - **Light**: Clean, high-contrast day design.
  - **Retro CRT**: 80s arcade terminal vibe with scanlines & green/pink neon glow.
  - **Paper**: Bookish print-puzzle aesthetics.
  - **High Contrast**: Maximum accessibility mode.
- 📱 **Dedicated Mobile-First Layout**: Custom responsive single-row mobile header, 48px minimum touch targets, 9-column digit keypad, and full-width primary submit action.
- ⏸️ **Auto-Pause & Progress Persistence**: State is automatically saved locally and synced to Neon PostgreSQL; timer automatically pauses when tab is backgrounded.
- ⚡ **Subtle Micro-Interactions**: Linear & Apple-inspired 60 FPS transitions, card entry staggers, animated count-up numbers, and automatic glowing text effects.

---

## 🛠️ Technology Stack

- **Frontend Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool & Router**: [Vite](https://vitejs.dev/), [TanStack Router](https://tanstack.com/router)
- **Styling & Icons**: [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Database & ORM**: [Neon PostgreSQL](https://neon.tech/) (Serverless), [Drizzle ORM](https://orm.drizzle.team/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) with localStorage persistence
- **Animations**: CSS keyframes, Canvas Confetti, and custom motion utilities

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
