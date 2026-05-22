import { expect, test } from '@playwright/test';

// Feature: horizon-social-ux-uplift, E2E: SPA navigation

test('shell navigation changes URL without document replacement', async ({ page }) => {
  await page.goto('/hertz');
  const marker = await page.evaluate(() => {
    document.body.dataset.spaMarker = crypto.randomUUID();
    return document.body.dataset.spaMarker;
  });
  await page.getByRole('link', { name: /notifikasi/i }).first().click();
  await expect(page).toHaveURL(/\/hertz\/notifications/);
  await expect.poll(() => page.evaluate(() => document.body.dataset.spaMarker)).toBe(marker);
});

test('post deep link opens modal inside HERTZ feed shell', async ({ page }) => {
  await page.goto('/hertz/post/hz_mticoc74');
  await expect(page.getByRole('dialog', { name: /detail postingan/i })).toBeVisible();
  await expect(page.locator('[data-spa-section="hertz"]')).toBeVisible();
});

test('outlook list section is SPA-marked', async ({ page }) => {
  await page.goto('/outlook');
  await expect(page.locator('[data-spa-section="outlook"]')).toBeVisible();
});
