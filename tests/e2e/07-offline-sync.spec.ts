import { test as base, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';
import { setupDatabaseMock } from '../../helpers/mockDatabase';
import { DashboardPage } from '../../pageObjects/DashboardPage';

import { loginUser } from '../../helpers/authHelper';

export const test = base;

test.describe('Offline Play & Syncing', () => {
  test('Local offline moves are not overwritten by an older cloud state upon reconnection', async ({ page, context }) => {
    const db = await setupDatabaseMock(page);
    await loginUser(page);
    const dashboard = new DashboardPage(page);

    await page.goto('/');
    
    // Set cloud DB to have 5 moves
    db.set('user_test', { // We don't know the exact UUID clerk makes, but let's assume it gets captured.
      // Wait, mockDatabase intercepts *all* POSTs. We can just wait for it.
    });

    // Instead of messing with exact user IDs, we just simulate the client fetching an older DB state
    await page.route('**/api/active-session*', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          json: {
            difficulty: 'easy',
            elapsedTime: 60,
            mistakes: 0,
            status: 'in_progress',
            boardState: {
              puzzle: new Array(81).fill(1),
              cells: new Array(81).fill({ value: 0, given: false, notes: [] }).map((c, i) => i < 5 ? { ...c, value: 1 } : c),
              hintsUsed: 0
            }
          }
        });
      }
      return route.continue();
    });

    // Disconnect network
    await context.setOffline(true);

    // Simulate user playing 10 moves offline locally via localStorage
    await page.evaluate(() => {
      window.localStorage.setItem('sudoku-game-v1', JSON.stringify({
        state: {
          puzzle: { puzzle: new Array(81).fill(1), difficulty: 'easy' },
          cells: new Array(81).fill({ value: 0, given: false, notes: [] }).map((c, i) => i < 10 ? { ...c, value: 1 } : c),
          hintsUsed: 0,
          mistakes: 0,
          won: false
        },
        version: 0
      }));
    });

    // Reconnect network and trigger the initial auth load sequence
    await context.setOffline(false);
    await page.reload();

    // Verify local storage still has 10 moves, NOT 5 (offline wins)
    const finalStoreStr = await page.evaluate(() => window.localStorage.getItem('sudoku-game-v1'));
    const store = JSON.parse(finalStoreStr!).state;

    const filledCount = store.cells.filter((c: any) => c.value !== 0).length;
    expect(filledCount).toBe(10);
  });
});
