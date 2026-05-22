import { expect, test } from '@playwright/test';

// Feature: horizon-social-ux-uplift, E2E: Notification bell

test('notification bell opens and closes', async ({ page }) => {
  await page.goto('/hertz');
  const bell = page.getByRole('button', { name: /notifikasi/i }).first();
  await bell.click();
  await expect(page.getByRole('dialog', { name: /notifikasi/i })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: /notifikasi/i })).toBeHidden();
});
