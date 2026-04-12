import { expect, test } from '@playwright/test';

test.describe('Vendor Panel smoke', () => {
  test('loads the login page with the identity form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
  });
  test('loads the dashboard shell', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('app-page-header h1')).toBeVisible();
  });
  test('loads the staff operations page and its switcher', async ({ page }) => {
    await page.goto('/staff');
    await expect(page.locator('app-page-header h1')).toBeVisible();
    await expect(page.getByRole('button', { name: /الفلاتر/i })).toBeVisible();
  });
  test('loads the alerts center and its list section', async ({ page }) => {
    await page.goto('/alerts');
    await expect(page.locator('app-page-header h1')).toBeVisible();
    await expect(page.locator('app-page-section-shell').first()).toBeVisible();
  });
});
