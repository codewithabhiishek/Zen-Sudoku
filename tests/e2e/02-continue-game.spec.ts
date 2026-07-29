import { test as base, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';
import { DashboardPage } from '../../pageObjects/DashboardPage';
import { GamePage } from '../../pageObjects/GamePage';
import { setupDatabaseMock } from '../../helpers/mockDatabase';

import { loginUser } from '../../helpers/authHelper';

export const test = base;

test.describe('Continue Game (Resume)', () => {
  test('Start game, make a move, refresh, and resume', async ({ page }) => {
    // Block Neon DB to prevent cloud sync from overwriting our local test state
    await page.route('**/*.neon.tech/**', route => route.abort());
    
    await loginUser(page);
    
    const dashboard = new DashboardPage(page);
    const game = new GamePage(page);

    await page.goto('/');
    
    await dashboard.startNewGame('Easy', 1);

    // We know cell 0,0 is definitely a cell. Wait, we don't know if 0,0 is given!
    // To make this fully deterministic, we inject a known puzzle via localStorage, OR we just find the first empty cell using data attributes.
    // Let's find the first empty cell by querying the DOM.
    const emptyCell = page.locator('.sudoku-cell:not([data-given="true"])').first();
    await emptyCell.click();
    
    // We don't know the exact row/col of the first empty cell, but we clicked it.
    // Now press a number, e.g., '1'
    await game.inputNumber(1);

    // Verify cell has the number
    await expect(emptyCell).toHaveText('1');

    // Return to dashboard / Refresh
    await page.goto('/');

    // Verify Continue Game card displays the correct level
    const continueBtn = page.getByTestId('continue-game-btn');
    // Using a case-insensitive match since the DOM might render 'easy'
    await expect(continueBtn).toContainText(/easy.*Level 1/i);

    // Resume Game
    await dashboard.resumeGame();

    // Verify the first empty cell STILL has 1
    const resumedCell = page.locator('.sudoku-cell:not([data-given="true"])').first();
    await expect(resumedCell).toHaveText('1');
  });
});
