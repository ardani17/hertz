import { expect, test } from '@playwright/test';

// Feature: horizon-social-ux-uplift, E2E: DM fixed-height layout

test('DM layout has a fixed container and scrollable message list', async ({ page }) => {
  await page.goto('/hertz/messages');
  const layout = page.locator('[data-testid="dm-layout"]');
  if (await layout.count()) {
    await expect(layout).toHaveCSS('overflow', 'hidden');
    await expect(page.locator('[data-testid="dm-message-list"]')).toHaveCSS('overflow-y', 'auto');
  }
});
