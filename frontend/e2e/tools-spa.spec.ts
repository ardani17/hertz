import { expect, test } from '@playwright/test';

// Feature: horizon-update-roadmap, E2E: Tools SPA shell

test('tools navigation keeps SPA section mounted', async ({ page }) => {
  await page.goto('/tools');
  const marker = await page.evaluate(() => {
    document.body.dataset.spaMarker = crypto.randomUUID();
    return document.body.dataset.spaMarker;
  });
  await expect(page.locator('[data-spa-section="tools"]')).toBeVisible();
  await page.getByRole('link', { name: 'Pivot Point', exact: true }).click();
  await expect(page).toHaveURL(/\/tools\/pivot-point/);
  await expect.poll(() => page.evaluate(() => document.body.dataset.spaMarker)).toBe(marker);
  await expect(page.locator('[data-spa-section="tools"]')).toBeVisible();
});

test('hidden tool routes return not found', async ({ page }) => {
  const response = await page.goto('/tools/cftc');
  expect(response?.status()).toBe(404);
});
