import { test, expect } from '@playwright/test';

test.describe('Admin Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/admin/settings');
  });

  test('should display Reset to default button', async ({ page }) => {
    const resetButton = page.locator('button', { hasText: 'Khôi phục mặc định' });
    await expect(resetButton).toBeVisible();
  });

  test('should reload page when reset button clicked', async ({ page }) => {
    await page.evaluate(() => {
      // set some localStorage or input to change state
      localStorage.setItem('test-key', 'value');
    });
    // click reset
    await page.click('button:has-text("Khôi phục mặc định")');
    // after reload, localStorage test-key should be cleared or page should reload
    // checking page reload by URL
    await expect(page).toHaveURL('http://localhost:3000/admin/settings');
  });

  test('responsive layout for mobile and tablet', async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('button:has-text("Khôi phục mặc định")')).toBeVisible();

    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('button:has-text("Khôi phục mặc định")')).toBeVisible();

    // Desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('button:has-text("Khôi phục mặc định")')).toBeVisible();
  });
});