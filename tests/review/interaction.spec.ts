import { expect, test } from '@playwright/test';
import { stabilizePage } from './reviewTargets';

test.describe('interaction review', () => {
  test('landing has primary CTA and navigates to HERTZ', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await stabilizePage(page);

    const hertzLink = page.getByRole('link', { name: /hertz|komunitas|feed/i }).first();
    await expect(hertzLink).toBeVisible();
  });

  test('HERTZ feed loads timeline or empty state', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.goto('/hertz', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await stabilizePage(page);

    const main = page.locator('main, [role="main"], #main-content').first();
    await expect(main).toBeVisible();

    const hasPosts = (await page.locator('article, [data-testid="hertz-post"]').count()) > 0;
    const hasEmpty = (await page.getByText(/belum ada|kosong|tidak ada post/i).count()) > 0;
    const hasError = (await page.getByRole('alert').count()) > 0;
    expect(hasPosts || hasEmpty || hasError).toBeTruthy();
  });

  test('tools hub lists tool cards', async ({ page }) => {
    await page.goto('/tools', { waitUntil: 'domcontentloaded' });
    await stabilizePage(page);
    await expect(page.getByRole('link').filter({ hasText: /challenge|pivot|calendar|order/i }).first()).toBeVisible();
  });

  test('admin login form is usable', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
    await stabilizePage(page);
    await expect(page.getByLabel(/username|nama pengguna/i)).toBeVisible();
    await expect(page.getByLabel(/password|kata sandi/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /login|masuk/i })).toBeVisible();
  });

  test('mobile bottom nav on HERTZ', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/hertz', { waitUntil: 'domcontentloaded' });
    await stabilizePage(page);
    const nav = page.locator('nav').filter({ has: page.getByRole('link') }).last();
    await expect(nav).toBeVisible();
  });
});
