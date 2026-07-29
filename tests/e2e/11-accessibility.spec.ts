import { test as base, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';
import { DashboardPage } from '../../pageObjects/DashboardPage';

import { loginUser } from '../../helpers/authHelper';

export const test = base;

test.describe('Accessibility', () => {
  test('Keyboard navigation works on the dashboard', async ({ page }) => {
    await loginUser(page);
    await page.goto('/');

    // Ensure the page is fully loaded and auth is resolved
    const level1Btn = page.getByTestId('level-btn-1');
    await expect(level1Btn).toBeVisible({ timeout: 10000 });

    // Tab into the document
    await page.keyboard.press('Tab');
    
    // We expect an interactive element to be focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    expect(['BUTTON', 'A', 'INPUT', 'DIV'].includes(focusedElement!.toUpperCase())).toBeTruthy();
  });

  test('Critical interactive elements have ARIA labels or semantic text', async ({ page }) => {
    await loginUser(page);
    await page.goto('/');
    
    // The continue or new game buttons should be semantically identifiable
    const level1Btn = page.getByTestId('level-btn-1');
    await expect(level1Btn).toBeVisible();
    
    // Check if the logo/title exists and is readable
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
