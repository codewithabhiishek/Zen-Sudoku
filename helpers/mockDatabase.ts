import { Page } from '@playwright/test';

/**
 * Mocks the Vercel KV Database API calls by intercepting the Neon/Vercel network requests.
 * Uses an in-memory store so tests remain deterministic and offline.
 */
export async function setupDatabaseMock(page: Page) {
  const dbStore = new Map<string, any>();

  // Mock any fetch requests that the app might make to a backend API (if it uses REST routes)
  // If the app uses Server Actions or Drizzle directly in the client, Playwright can intercept RPC calls.
  
  await page.route('**/api/active-session*', async (route) => {
    const method = route.request().method();
    
    if (method === 'GET') {
      const url = new URL(route.request().url());
      const userId = url.searchParams.get('userId') || 'mock_user';
      const data = dbStore.get(userId) || null;
      return route.fulfill({ status: 200, json: data });
    }
    
    if (method === 'POST') {
      const body = route.request().postDataJSON();
      dbStore.set(body.userId, body);
      return route.fulfill({ status: 200, json: body });
    }
    
    if (method === 'DELETE') {
      const url = new URL(route.request().url());
      const userId = url.searchParams.get('userId') || 'mock_user';
      dbStore.delete(userId);
      return route.fulfill({ status: 200, json: { success: true } });
    }
    
    return route.continue();
  });

  return dbStore;
}
