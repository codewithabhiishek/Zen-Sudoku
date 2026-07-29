import { test as base, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';
import { DashboardPage } from '../../pageObjects/DashboardPage';

import { loginUser } from '../../helpers/authHelper';

export const test = base;

test.describe('Responsive Layout', () => {
  test('Dashboard loads correctly on mobile viewport', async ({ page }) => {
    await loginUser(page);
    await page.goto('/');

    await page.setViewportSize({ width: 375, height: 812 });
    
    // Check if Continue Game or level buttons are accessible
    const dashboard = new DashboardPage(page);
    // On a fresh account, level 1 should be visible
    const level1Btn = page.getByTestId('level-btn-1');
    await expect(level1Btn).toBeVisible({ timeout: 10000 });
    
    const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasHorizontalScroll).toBeFalsy();
  });

  test('Dashboard loads correctly on tablet viewport', async ({ page }) => {
    await loginUser(page);
    await page.goto('/');

    await page.setViewportSize({ width: 768, height: 1024 });
    const level1Btn = page.getByTestId('level-btn-1');
    await expect(level1Btn).toBeVisible({ timeout: 10000 });
  });
});
