import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { makeReviewTitle, reviewPages, reviewViewports, stabilizePage } from './reviewTargets';

const tags = (process.env.REVIEW_A11Y_TAGS ?? 'wcag2a,wcag2aa,wcag21a,wcag21aa').split(',');
const failingImpacts = new Set((process.env.REVIEW_A11Y_FAIL_IMPACTS ?? 'critical,serious').split(','));

function formatViolations(violations: Array<{ id: string; impact?: string | null; help: string; nodes: unknown[] }>) {
  return violations
    .map((violation) => {
      return [
        `${violation.id} (${violation.impact ?? 'unknown'})`,
        violation.help,
        `nodes: ${violation.nodes.length}`,
      ].join(' - ');
    })
    .join('\n');
}

test.describe('accessibility review', () => {
  for (const target of reviewPages) {
    for (const viewport of reviewViewports) {
      test(makeReviewTitle(target.name, viewport.name), async ({ page }, testInfo) => {
        await page.setViewportSize(viewport);
        await page.goto(target.path, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => undefined);
        await stabilizePage(page);

        const result = await new AxeBuilder({ page }).withTags(tags).analyze();
        const violations = result.violations.filter((violation) =>
          failingImpacts.has(violation.impact ?? 'unknown'),
        );

        await testInfo.attach('axe-result.json', {
          body: JSON.stringify(result, null, 2),
          contentType: 'application/json',
        });

        expect(violations, formatViolations(violations)).toEqual([]);
      });
    }
  }
});
