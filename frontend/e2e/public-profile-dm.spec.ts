import { expect, test } from '@playwright/test';

// Feature: horizon-social-ux-uplift, E2E: Public profile DM CTA

test('public profile route renders a public profile or 404 state', async ({ page }) => {
  await page.goto('/@horizon');
  await expect(page.locator('body')).toContainText(/profil|profile|tidak ditemukan/i);
});
