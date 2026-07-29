import { expect, Locator, Page } from '@playwright/test';

export class GamePage {
  readonly page: Page;
  readonly grid: Locator;
  readonly timer: Locator;
  readonly mistakes: Locator;
  readonly hintBtn: Locator;
  readonly notesBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.grid = page.locator('.sudoku-grid');
    this.timer = page.locator('[aria-label="Timer"], text=Elapsed');
    this.mistakes = page.locator('[aria-label="Mistakes"], text=Mistakes');
    this.hintBtn = page.getByRole('button', { name: /hint/i });
    this.notesBtn = page.getByRole('button', { name: /notes/i });
  }

  async selectCell(row: number, col: number) {
    const cell = this.page.getByTestId(`cell-${row}-${col}`);
    await cell.click();
  }

  async inputNumber(num: number) {
    // We now use the exact testId from the keypad
    const btn = this.page.getByTestId(`numpad-${num}`);
    await btn.click();
  }

  async fillCell(row: number, col: number, value: number) {
    await this.selectCell(row, col);
    await this.inputNumber(value);
  }

  async toggleNotes() {
    await this.notesBtn.click();
  }

  async useHint() {
    await this.hintBtn.click();
  }

  async getMistakeCount() {
    const text = await this.mistakes.textContent();
    if (!text) return 0;
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }
}
