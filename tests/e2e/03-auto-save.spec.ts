import { test as base, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';
import { setupDatabaseMock } from '../../helpers/mockDatabase';
import { DashboardPage } from '../../pageObjects/DashboardPage';
import { GamePage } from '../../pageObjects/GamePage';

import { loginUser } from '../../helpers/authHelper';

export const test = base;

test.describe('Auto Save (Cloud Database)', () => {
  test('Verifies auto-save network requests are dispatched on moves and hints', async ({ page }) => {
    // Intercept Neon DB requests to track saves
    let saveCount = 0;
    await page.route('**/*.neon.tech/**', async (route) => {
      const method = route.request().method();
      const postData = route.request().postData() || '';
      
      // Auto-saves use upsert on game_sessions
      if (method === 'POST' && postData.includes('game_sessions') && postData.includes('board_state')) {
        saveCount++;
      }
      await route.continue();
    });

    await loginUser(page);
    
    const dashboard = new DashboardPage(page);
    const game = new GamePage(page);

    await page.goto('/');
    
    // Start game
    await dashboard.startNewGame('Easy', 1);

    // Get the Clerk User ID from the window (since we don't know what clerk generates)
    // Actually, Clerk testing generates a real user object, but we mocked the DB to intercept ANY /api/active-session
    // and grab the userId from the query params or body.
    
    // Wait for initial active game session save
    await expect.poll(() => saveCount, { timeout: 10000 }).toBeGreaterThan(0);
    
    const initialSaves = saveCount;

    // 1. Move save
    const emptyCell = page.locator('.sudoku-cell:not([data-given="true"])').first();
    await emptyCell.click();
    await game.inputNumber(1);
    
    // Validate network request was dispatched for the move
    await expect.poll(() => saveCount, { timeout: 10000 }).toBeGreaterThan(initialSaves);
    
    const savesAfterMove = saveCount;

    // 2. Hint save
    await game.useHint();
    
    // Validate network request was dispatched for the hint
    await expect.poll(() => saveCount, { timeout: 10000 }).toBeGreaterThan(savesAfterMove);
  });
});
