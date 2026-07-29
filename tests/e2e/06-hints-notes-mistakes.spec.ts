import { test as base, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';
import { DashboardPage } from '../../pageObjects/DashboardPage';
import { GamePage } from '../../pageObjects/GamePage';
import { getMockPuzzle } from '../../helpers/sudokuHelpers';
import { setupDatabaseMock } from '../../helpers/mockDatabase';
import { loginUser } from '../../helpers/authHelper';

export const test = base;

test.describe('Hints, Notes, and Mistakes', () => {
  test('Verify hints, notes, and mistakes persist upon resume and behave correctly', async ({ page }) => {
    await setupDatabaseMock(page);
    await loginUser(page);
    
    const dashboard = new DashboardPage(page);
    const game = new GamePage(page);
    
    await dashboard.startNewGame('Easy', 1);

    // Wait for the grid to render so cells are definitely present
    await page.waitForURL('**/game*');
    await expect(page.getByRole('grid')).toBeVisible();

    // Read the generated puzzle solution from localStorage
    const storeStr = await page.evaluate(() => window.localStorage.getItem('sudoku-game-v1'));
    const store = JSON.parse(storeStr!);
    const solution = store.state.puzzle.solution;
    
    // Find an empty cell
    const cells = store.state.cells;
    const emptyIndex = cells.findIndex((c: any) => c.value === 0);
    const r = Math.floor(emptyIndex / 9);
    const c = emptyIndex % 9;
    
    const correctValue = solution[emptyIndex];
    const wrongValue = correctValue === 9 ? 8 : 9;

    // Make a mistake on the empty cell
    await game.fillCell(r, c, wrongValue);

    // Verify mistake registered (red text or mistake counter increment)
    // The mistake counter is in the header, let's verify localStorage instead
    let newStoreStr = await page.evaluate(() => window.localStorage.getItem('sudoku-game-v1'));
    let newStore = JSON.parse(newStoreStr!);
    expect(newStore.state.mistakes).toBe(1);

    // Use a hint
    await page.getByRole('button', { name: /hint/i }).click();

    // Dismiss the explanation modal that pops up
    await page.getByRole('button', { name: /got it/i }).click();

    // Verify hint registered
    newStoreStr = await page.evaluate(() => window.localStorage.getItem('sudoku-game-v1'));
    newStore = JSON.parse(newStoreStr!);
    expect(newStore.state.hintsUsed).toBe(1);

    // Add a note to a DIFFERENT empty cell
    const cells2 = newStore.state.cells;
    const emptyIndex2 = cells2.findIndex((c: any, idx: number) => c.value === 0 && idx !== emptyIndex);
    const r2 = Math.floor(emptyIndex2 / 9);
    const c2 = emptyIndex2 % 9;

    await page.getByRole('button', { name: /notes/i }).click(); // toggle note mode
    await game.selectCell(r2, c2);
    await game.inputNumber(1);

    newStoreStr = await page.evaluate(() => window.localStorage.getItem('sudoku-game-v1'));
    newStore = JSON.parse(newStoreStr!);
    expect(newStore.state.cells[emptyIndex2].notes).toContain(1);

    // Refresh page (Simulate closing app)
    await page.reload();
    await expect(page.getByRole('grid')).toBeVisible();

    // Verify state persists
    const persistedStoreStr = await page.evaluate(() => window.localStorage.getItem('sudoku-game-v1'));
    const persistedStore = JSON.parse(persistedStoreStr!);
    expect(persistedStore.state.mistakes).toBe(1);
    expect(persistedStore.state.hintsUsed).toBe(1);
    expect(persistedStore.state.cells[emptyIndex2].notes).toContain(1);
  });
});
