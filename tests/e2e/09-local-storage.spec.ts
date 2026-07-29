import { test as base, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';
import { DashboardPage } from '../../pageObjects/DashboardPage';

import { loginUser } from '../../helpers/authHelper';

export const test = base;

test.describe('Local Storage Persistence', () => {
  test('Verify Zustand writes to localStorage on unmount/refresh', async ({ page }) => {
    await loginUser(page);
    const dashboard = new DashboardPage(page);
    await page.goto('/');

    await dashboard.startNewGame('Easy', 1);

    // Wait for the game to actually render
    await page.waitForURL('**/game*');
    await expect(page.getByRole('grid')).toBeVisible();

    // Verify localStorage key exists
    const storeStr = await page.evaluate(() => window.localStorage.getItem('sudoku-game-v1'));
    expect(storeStr).toBeTruthy();
    const store = JSON.parse(storeStr!);
    
    expect(store.state.puzzle.difficulty).toBe('easy');
    expect(store.state.running).toBe(true);

    // Reload perfectly simulates closing and reopening the tab
    await page.reload();

    const resumedStoreStr = await page.evaluate(() => window.localStorage.getItem('sudoku-game-v1'));
    expect(resumedStoreStr).toBeTruthy();
    const resumedStore = JSON.parse(resumedStoreStr!);

    expect(resumedStore.state.puzzle.difficulty).toBe('easy');
    expect(resumedStore.state.running).toBe(true);
  });
});
