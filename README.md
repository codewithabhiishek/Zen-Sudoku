# Zen Sudoku 🧩

A modern, high-performance, and mathematical Sudoku application built with React, Vite, TypeScript, Tailwind CSS, and TanStack. Every puzzle generated is guaranteed to have **exactly one unique solution**, mathematically verified with logic-based technique rating.

---

## ✨ Features

- 🎯 **Guaranteed Unique Puzzles**: Puzzles are generated and verified via backtracking & MRV solvers to ensure a single valid solution every time.
- 📊 **Technique-Based Rating**: Difficulty levels (Easy, Medium, Hard, Expert) are classified by the hardest logical technique required (Naked/Hidden Singles, Pointing Pairs, Box-Line Reduction, Hidden Pairs, X-Wing).
- 🏆 **10 Levels Per Difficulty**: 40 distinct levels scaling smoothly from Starter to Grandmaster.
- 💡 **Smart Hints & Explanations**: Step-by-step mathematical breakdown for any cell, explaining row, column, and box constraints.
- 🎨 **Multiple Visual Themes**:
  - **Light**: Clean, high-contrast day design.
  - **Dark**: Sleek midnight theme.
  - **Retro CRT**: 80s arcade terminal vibe with scanlines & green/pink neon glow.
  - **Paper**: Bookish print-puzzle aesthetics.
  - **High Contrast**: Maximum accessibility mode.
- 🔤 **Typography**: Built with **Syne** (for bold titles) and **Space Grotesk** (for sharp, geometric numbers & UI).
- 📱 **Fully Responsive & Accessible**: Optimized for desktop, iPad/tablets, Android, and iPhone with native `safe-area-inset` support for notches and home bars.
- ⏸️ **Auto-Pause & Progress Persistence**: State is automatically saved locally; timer automatically pauses when tab is backgrounded.

---

## 🛠️ Technology Stack

- **Framework & Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool & Router**: [Vite](https://vitejs.dev/), [TanStack Router](https://tanstack.com/router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), Lucide Icons
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) with localStorage persistence
- **Animations**: Custom CSS keyframes & micro-interactions

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

## 📄 License

MIT License — feel free to use and customize for your own projects!
