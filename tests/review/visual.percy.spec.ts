import percySnapshot from '@percy/playwright';
import { test } from '@playwright/test';
import {
  makeReviewTitle,
  reviewPages,
  reviewViewports,
  stabilizePage,
} from './reviewTargets';

test.describe('percy visual review', () => {
  test.skip(!process.env.PERCY_TOKEN, 'PERCY_TOKEN required — run via: npm run review:percy');

  for (const target of reviewPages) {
    for (const viewport of reviewViewports) {
      test(makeReviewTitle(target.name, viewport.name), async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(target.path, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => undefined);
        await stabilizePage(page);

        await percySnapshot(page, `${target.name}-${viewport.name}`, {
          fullPage: true,
        });
      });
    }
  }
});
