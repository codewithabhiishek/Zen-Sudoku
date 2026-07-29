# Zen Sudoku - Playwright E2E Test Suite

This directory contains the automated end-to-end testing suite for the Zen Sudoku application. The suite covers critical paths including gameplay, offline progression, multi-device real-time synchronization, statistics aggregation, and authentication flows.

## Architecture & Design
Due to the dependency on Clerk (Auth) and Vercel KV (DB), the test suite utilizes Playwright Network Interception (`page.route`) and `localStorage` injection. This allows the suite to run completely offline, deterministically, and without requiring valid Clerk testing API keys.

The following helpers facilitate this:
- `/helpers/mockClerk.ts`: Stubs out the Clerk token payloads and Zustand `user-storage`.
- `/helpers/mockDatabase.ts`: Creates an in-memory Map structure that mocks the `GET/POST` requests normally routed to Vercel Postgres/KV.

## Available Commands

Run these commands from the root directory:

- **Run Tests Headless (CI):** 
  ```bash
  npm run test:e2e
  ```
- **Run Tests with Visible UI (Debug mode):** 
  ```bash
  npm run test:ui
  ```
- **Run Tests in Headed Mode:** 
  ```bash
  npm run test:headed
  ```
- **View HTML Test Report:** 
  ```bash
  npm run test:report
  ```

## Test Suites Breakdown
1. **01-auth.spec.ts:** Validates login, session injection, and persistence across refreshes.
2. **02-continue-game.spec.ts:** Ensures a game can be started, a cell filled, and seamlessly resumed from the dashboard.
3. **03-auto-save.spec.ts:** Intercepts the mocked DB to guarantee network requests fire when moves or hints occur.
4. **04-progression.spec.ts:** Verifies Level $N$ remains locked and unplayable until Level $N-1$ is fully completed.
5. **05-statistics.spec.ts:** Tests the complex auto-heal merging algorithm, ensuring valid XP and wins are retained.
6. **06-hints-notes-mistakes.spec.ts:** Ensures auxiliary states (hints used, mistake counts) persist properly upon resume.
7. **07-offline-sync.spec.ts:** Disconnects the network, simulates offline gameplay, reconnects, and proves that local moves take precedence over stale cloud data.
8. **08-multi-tab-sync.spec.ts:** Spawns two isolated `BrowserContexts` sharing a single mocked DB reference to simulate real-time collaborative conflict resolution (Phone vs Laptop).
9. **09-local-storage.spec.ts:** Tests pure Zustand persistence independently of network state.
10. **10-responsive.spec.ts:** Viewport mutation testing for Dashboard elements.
11. **11-accessibility.spec.ts:** Basic structural Tab-key routing and ARIA-label verification.
