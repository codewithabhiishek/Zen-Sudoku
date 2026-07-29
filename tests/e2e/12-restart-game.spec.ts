import { test as base, expect } from '@playwright/test';
import { DashboardPage } from '../../pageObjects/DashboardPage';
import { GamePage } from '../../pageObjects/GamePage';
import { loginUser } from '../../helpers/authHelper';

export const test = base;

test.describe('Restart Game (Reset Button)', () => {
  test('Clicking Reset clears board, resets timer/mistakes, and stays on game screen', async ({ page }) => {
    let saveCount = 0;
    await page.route('**/*.neon.tech/**', async (route) => {
      const method = route.request().method();
      const postData = route.request().postData() || '';
      if (method === 'POST' && postData.includes('game_sessions') && postData.includes('board_state')) {
        saveCount++;
      }
      await route.continue();
    });

    await loginUser(page);
    
    const dashboard = new DashboardPage(page);
    const game = new GamePage(page);
    
    await dashboard.startNewGame('Easy', 1);

    await page.waitForURL('**/game*');
    await expect(page.getByRole('grid')).toBeVisible();

    const storeStr = await page.evaluate(() => window.localStorage.getItem('sudoku-game-v1'));
    const store = JSON.parse(storeStr!);
    const solution = store.state.puzzle.solution;
    
    const cells = store.state.cells;
    const emptyIndex1 = cells.findIndex((c: any) => c.value === 0);
    const emptyIndex2 = cells.findLastIndex((c: any) => c.value === 0);
    const emptyIndex3 = cells.findIndex((c: any, idx: number) => c.value === 0 && idx !== emptyIndex1 && idx !== emptyIndex2);
    
    const r1 = Math.floor(emptyIndex1 / 9);
    const c1 = emptyIndex1 % 9;
    const r2 = Math.floor(emptyIndex2 / 9);
    const c2 = emptyIndex2 % 9;
    
    const correctValue = solution[emptyIndex1];
    const wrongValue = correctValue === 9 ? 8 : 9;
    await game.fillCell(r1, c1, wrongValue);

    await game.toggleNotes();
    await game.selectCell(r2, c2);
    const noteValue = solution[emptyIndex2];
    await game.inputNumber(noteValue);
    await page.waitForTimeout(100);

    // Select emptyIndex3 so Hint applies there instead of overwriting mistake or note
    const r3 = Math.floor(emptyIndex3 / 9);
    const c3 = emptyIndex3 % 9;
    await game.selectCell(r3, c3);
    await page.getByRole('button', { name: /hint/i }).click();
    await page.getByRole('button', { name: /got it/i }).click();
    
    let currentStore = await page.evaluate(() => JSON.parse(window.localStorage.getItem('sudoku-game-v1')!));
    expect(currentStore.state.mistakes).toBeGreaterThan(0);
    expect(currentStore.state.cells[emptyIndex1].value).toBe(wrongValue);
    expect(currentStore.state.cells[emptyIndex2].notes).toContain(noteValue);
    expect(currentStore.state.hintsUsed).toBe(1);
    expect(currentStore.state.history.length).toBeGreaterThan(0);

    const initialSaves = saveCount;

    await page.getByRole('button', { name: /Restart Puzzle/i }).click();

    expect(page.url()).toContain('/game');

    let resetStore = await page.evaluate(() => JSON.parse(window.localStorage.getItem('sudoku-game-v1')!));
    
    expect(resetStore.state.mistakes).toBe(0);
    expect(resetStore.state.hintsUsed).toBe(0);
    expect(resetStore.state.elapsedMs).toBe(0);
    expect(resetStore.state.history.length).toBe(0);
    
    expect(resetStore.state.cells[emptyIndex1].value).toBe(0);
    expect(resetStore.state.cells[emptyIndex2].notes.length).toBe(0);
    
    const totalFilledBefore = cells.filter((c: any) => c.given).length;
    const totalFilledAfter = resetStore.state.cells.filter((c: any) => c.value !== 0).length;
    expect(totalFilledAfter).toBe(totalFilledBefore);

    await expect.poll(() => saveCount, { timeout: 10000 }).toBeGreaterThan(initialSaves);

    await expect(page.getByText('Mistakes:0')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('grid')).toBeVisible();

    let resumedStore = await page.evaluate(() => JSON.parse(window.localStorage.getItem('sudoku-game-v1')!));
    expect(resumedStore.state.mistakes).toBe(0);
    expect(resumedStore.state.hintsUsed).toBe(0);
    expect(resumedStore.state.cells[emptyIndex1].value).toBe(0);
  });
});
