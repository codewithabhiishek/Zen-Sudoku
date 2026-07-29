import { expect, Locator, Page } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly continueGameBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.continueGameBtn = page.getByTestId('continue-game-btn');
  }

  async startNewGame(difficulty = 'Easy', level = 1) {
    // Select difficulty
    const diffBtn = this.page.getByRole('button', { name: new RegExp(difficulty, 'i'), exact: true }).first();
    await expect(diffBtn).toBeVisible();
    await diffBtn.click();

    // Pick level
    const levelBtn = this.page.getByTestId(`level-btn-${level}`);
    await expect(levelBtn).toBeVisible();
    
    // Assert it is not locked before clicking
    await expect(levelBtn.getByText('Locked')).toBeHidden();
    await levelBtn.click();
  }

  async resumeGame() {
    await expect(this.continueGameBtn).toBeVisible();
    await this.continueGameBtn.click();
  }
}
