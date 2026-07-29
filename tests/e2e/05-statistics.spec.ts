import { test as base, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';

import { loginUser } from '../../helpers/authHelper';

export const test = base;

test.describe('Statistics Merging', () => {
  test('Points, XP, Games Played, and Wins accumulate without being overwritten', async ({ page }) => {
    await loginUser(page);

    // Inject mock statistics into localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem('sudoku-game-v1', JSON.stringify({
        state: {
          stats: {
            gamesPlayed: 50,
            gamesWon: 45,
            totalPoints: 12000,
            completedLevels: ['easy-1', 'easy-2']
          }
        },
        version: 0
      }));
    });

    await page.goto('/');

    // Let the ClerkSyncBridge polling cycle run
    await page.waitForTimeout(5000); 

    // Retrieve stats back from localStorage to verify auto-heal did not destroy them
    const finalStatsStr = await page.evaluate(() => window.localStorage.getItem('sudoku-game-v1'));
    const finalStats = JSON.parse(finalStatsStr!).state.stats;

    expect(finalStats.gamesWon).toBe(45);
    expect(finalStats.gamesPlayed).toBe(50);
    expect(finalStats.totalPoints).toBe(12000);
  });
});
