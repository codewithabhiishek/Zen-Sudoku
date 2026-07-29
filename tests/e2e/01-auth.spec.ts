import { test, expect } from '@playwright/test';
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';

test.describe('Authentication & Session Persistence', () => {
  test('User can log in and see their profile', async ({ page }) => {
    // 1. Bypass bot protection
    await setupClerkTestingToken({ page });
    
    // 2. Load page to inject Clerk
    await page.goto('/');
    await clerk.loaded({ page });
    
    // 3. Sign in via backend ticket
    await clerk.signIn({
      page,
      emailAddress: 'codewithabhiishek@gmail.com'
    });
    
    // 4. Verify auth
    await page.goto('/profile');
    const avatar = page.locator('.cl-userButtonTrigger');
    await expect(avatar).toBeVisible({ timeout: 15000 });
  });

  test('Session persists across refresh', async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto('/');
    await clerk.signIn({ page, emailAddress: 'codewithabhiishek@gmail.com' });
    
    await page.goto('/profile');
    const avatar = page.locator('.cl-userButtonTrigger');
    await expect(avatar).toBeVisible({ timeout: 15000 });

    await page.reload();
    await expect(avatar).toBeVisible({ timeout: 15000 });
  });
});
