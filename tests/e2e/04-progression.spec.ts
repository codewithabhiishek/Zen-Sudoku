import { test as base, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';
import { DashboardPage } from '../../pageObjects/DashboardPage';

import { loginUser } from '../../helpers/authHelper';
import { setupDatabaseMock } from '../../helpers/mockDatabase';

export const test = base;

test.describe('Level Progression Locking', () => {
  test('Fresh account cannot open Level 10 and Level 2 unlocks after completing Level 1', async ({ page }) => {
    // Navigate to app first so localStorage is accessible
    await page.goto('/');
    
    // Clear localStorage to prevent any stale redirects to /game
    await page.evaluate(() => window.localStorage.clear());
    
    // Setup Mock DB so the user has a completely fresh cloud profile
    await setupDatabaseMock(page);
    
    // Login user
    await loginUser(page);
    
    // Force 0 completed levels for this test since the test account may have completed levels from other tests
    await page.evaluate(() => {
      const storeStr = window.localStorage.getItem('sudoku-game-v1');
      const store = storeStr ? JSON.parse(storeStr) : { state: { stats: {} } };
      if (!store.state) store.state = {};
      if (!store.state.stats) store.state.stats = {};
      store.state.stats.completedLevels = [];
      window.localStorage.setItem('sudoku-game-v1', JSON.stringify(store));
    });
    
    // Refresh to apply the cleared stats
    await page.reload();
    await expect(page.getByRole('heading', { name: /zen sudoku/i })).toBeVisible({ timeout: 15000 });
    
    // Pick Expert
    await page.getByRole('button', { name: 'Expert', exact: true }).click();
    await expect(page.getByText('Expert Tier')).toBeVisible();

    // Verify Level 10 is locked
    const level10Btn = page.getByTestId('level-btn-10');
    await expect(level10Btn.getByText('Locked')).toBeVisible();

    // Verify Level 2 is locked
    const level2Btn = page.getByTestId('level-btn-2');
    await expect(level2Btn.getByText('Locked')).toBeVisible();

    // Mock completion of Level 1 via localStorage injection
    // Even with real Auth, completed levels are stored in local storage and synced.
    // For this specific test, testing the unlocking mechanism UI response is sufficient.
    await page.evaluate(() => {
      const storeStr = window.localStorage.getItem('sudoku-game-v1');
      const store = storeStr ? JSON.parse(storeStr) : { state: { stats: {} } };
      if (!store.state) store.state = {};
      if (!store.state.stats) store.state.stats = {};
      
      store.state.stats.completedLevels = ['expert-1'];
      window.localStorage.setItem('sudoku-game-v1', JSON.stringify(store));
    });

    // Refresh UI
    await page.reload();
    await expect(page.getByRole('heading', { name: /zen sudoku/i })).toBeVisible({ timeout: 15000 });
    
    // Pick Expert Again
    await page.getByRole('button', { name: 'Expert', exact: true }).click();
    await expect(page.getByText('Expert Tier')).toBeVisible();

    // Verify Level 2 is UNLOCKED
    await expect(level2Btn.getByText('Locked')).toBeHidden();

    // Verify Level 3 is still locked
    const level3Btn = page.getByTestId('level-btn-3');
    await expect(level3Btn.getByText('Locked')).toBeVisible();
  });
});
