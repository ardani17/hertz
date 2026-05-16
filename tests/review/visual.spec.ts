import { expect, test } from '@playwright/test';
import {
  makeReviewTitle,
  makeSnapshotName,
  reviewPages,
  reviewViewports,
  stabilizePage,
} from './reviewTargets';

test.describe('visual regression review', () => {
  for (const target of reviewPages) {
    for (const viewport of reviewViewports) {
      test(makeReviewTitle(target.name, viewport.name), async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(target.path, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => undefined);
        await stabilizePage(page);

        await expect(page).toHaveScreenshot(makeSnapshotName(target.name, viewport.name), {
          fullPage: true,
        });
      });
    }
  }
});
