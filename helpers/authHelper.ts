import { Page, expect } from '@playwright/test';
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';

export async function loginUser(page: Page) {
  await setupClerkTestingToken({ page });
  await page.goto('/');
  await clerk.loaded({ page });
  await clerk.signIn({ page, emailAddress: 'codewithabhiishek@gmail.com' });
  
  // Force navigation to the dashboard and wait for it
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /zen sudoku/i })).toBeVisible({ timeout: 15000 });
  
  // Ensure we are definitely on the dashboard (not redirected to /game)
  // If we somehow ended up on /game, click the Home button
  if (page.url().includes('/game')) {
    await page.getByRole('button', { name: /back to home|home/i }).first().click();
    await page.waitForURL('**/?*');
  }
}

export async function registerNewUser(page: Page) {
  const timestamp = Date.now();
  const testEmail = `codewithabhiishek+test_${timestamp}@gmail.com`;
  
  await setupClerkTestingToken({ page });
  await page.goto('/');
  await clerk.loaded({ page });
  await clerk.signUp({ page, emailAddress: testEmail });
  
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /zen sudoku/i })).toBeVisible({ timeout: 15000 });
}
