import { expect, test } from '@playwright/test';

test('tools stay on /tools URL when switching tools', async ({ page }) => {
  await page.goto('/tools');
  await expect(page).toHaveURL(/\/tools\/?$/);
  await expect(page.locator('[data-spa-section="tools"]')).toBeVisible();

  await page.getByRole('button', { name: 'Pivot Point', exact: true }).click();
  await expect(page).toHaveURL(/\/tools\/?$/);
  await expect(page.getByRole('heading', { name: 'Pivot Point Calculator' })).toBeVisible();

  await page.getByRole('button', { name: 'Profitability', exact: true }).click();
  await expect(page).toHaveURL(/\/tools\/?$/);
  await expect(page.getByRole('heading', { name: 'Profitability Simulator' })).toBeVisible();

  await page.getByRole('button', { name: 'Challenge Tracker', exact: true }).click();
  await expect(page).toHaveURL(/\/tools\/?$/);
  await expect(page.getByRole('heading', { name: 'Challenge Tracker' })).toBeVisible();

  await page.getByRole('button', { name: 'Elliott Wave', exact: true }).click();
  await expect(page).toHaveURL(/\/tools\/?$/);
  await expect(page.getByRole('heading', { name: 'Elliott Wave Calculator' })).toBeVisible();

  await page.getByRole('button', { name: /^(All tools|Semua tools)$/ }).click();
  await expect(page).toHaveURL(/\/tools\/?$/);
  await expect(page.getByRole('heading', { name: /Kalkulator dan tracker|Trading calculators and trackers/ })).toBeVisible();
});

test('legacy tool URLs redirect to /tools', async ({ page }) => {
  for (const [path, heading] of [
    ['/tools/pivot-point', 'Pivot Point Calculator'],
    ['/tools/profitability', 'Profitability Simulator'],
    ['/tools/challenge-tracker', 'Challenge Tracker'],
    ['/tools/elliott-wave', 'Elliott Wave Calculator'],
  ] as const) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/tools\/?$/);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }
});

test('hidden tool routes return not found', async ({ page }) => {
  const response = await page.goto('/tools/cftc');
  expect(response?.status()).toBe(404);
});
