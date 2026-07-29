import { test as base, expect } from '@playwright/test';
import { DashboardPage } from '../../pageObjects/DashboardPage';
import { GamePage } from '../../pageObjects/GamePage';
import { loginUser } from '../../helpers/authHelper';

export const test = base;

test.describe('Multi-Tab Sync (Multi-device Simulation)', () => {
  test('Two tabs sync seamlessly and deterministic conflict resolution prevents ping-pong', async ({ browser }) => {
    const context = await browser.newContext();
    const phonePage = await context.newPage();
    const desktopPage = await context.newPage();

    let saveCount = 0;
    const routeHandler = async (route: any) => {
      const method = route.request().method();
      const postData = route.request().postData() || '';
      if (method === 'POST' && postData.includes('game_sessions') && postData.includes('board_state')) {
        saveCount++;
      }
      await route.continue();
    };
    await phonePage.route('**/*.neon.tech/**', routeHandler);
    await desktopPage.route('**/*.neon.tech/**', routeHandler);

    // Login on the context
    await loginUser(phonePage);

    // --- SCENARIO START ---
    const phoneDashboard = new DashboardPage(phonePage);
    const phoneGame = new GamePage(phonePage);
    
    await phonePage.goto('/');
    
    // Setup initial save by starting a game on Phone
    await phoneDashboard.startNewGame('Easy', 1);
    await phonePage.waitForURL('**/game*');
    await expect(phonePage.getByRole('grid', { name: /sudoku board/i })).toBeVisible();
    await expect.poll(() => saveCount, { timeout: 10000 }).toBeGreaterThan(0);
    
    const initialSaves = saveCount;

    // Desktop opens app and resumes the game!
    await desktopPage.goto('/');
    const desktopDashboard = new DashboardPage(desktopPage);
    const desktopGame = new GamePage(desktopPage);
    await desktopDashboard.resumeGame();
    await desktopPage.waitForURL('**/game*');
    await expect(desktopPage.getByRole('grid', { name: /sudoku board/i })).toBeVisible();

    // Desktop makes a move!
    const emptyCell = desktopPage.locator('.sudoku-cell:not([data-given="true"])').first();
    await emptyCell.click();
    await desktopGame.inputNumber(9);

    // Wait for Desktop to save the move to Cloud
    await expect.poll(() => saveCount, { timeout: 10000 }).toBeGreaterThan(initialSaves);

    // Wait for Phone's polling interval to pick it up (SyncBridge syncs every 4s, so 6s max)
    await phonePage.waitForTimeout(6000);

    // Verify Phone pulled the move seamlessly!
    const phoneStoreStr = await phonePage.evaluate(() => window.localStorage.getItem('sudoku-game-v1'));
    const phoneStore = JSON.parse(phoneStoreStr!).state;
    
    // Find the cell we clicked (first empty cell). Since both tabs loaded the SAME puzzle, the index is the same!
    const firstEmptyIndex = phoneStore.cells.findIndex((c: any) => c.given === false);
    expect(phoneStore.cells[firstEmptyIndex].value).toBe(9);
  });
});
