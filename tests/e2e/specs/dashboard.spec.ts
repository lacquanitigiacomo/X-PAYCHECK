import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('displays stats cards', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@x-paycheck.local');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await expect(page.locator('text=Bilancio')).toBeVisible();
    await expect(page.locator('text=Spese Mese')).toBeVisible();
  });
});
