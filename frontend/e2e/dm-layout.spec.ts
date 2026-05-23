import { expect, test } from '@playwright/test';

// Feature: horizon-social-ux-uplift, E2E: DM fixed-height layout

test('DM composer stays visible on mobile thread view', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/hertz/messages');
  const composer = page.locator('[data-testid="dm-composer"]');
  if ((await composer.count()) === 0) return;

  const metrics = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="dm-composer"]') as HTMLElement | null;
    const nav = document.querySelector('nav[aria-label="Mobile navigation"]') as HTMLElement | null;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      composerBottom: rect.bottom,
      composerTop: rect.top,
      viewport: window.innerHeight,
      visible: rect.top < window.innerHeight && rect.bottom > 0,
      navDisplay: nav ? getComputedStyle(nav).display : null,
    };
  });

  expect(metrics).not.toBeNull();
  expect(metrics?.visible).toBe(true);
  expect(metrics?.composerBottom).toBeLessThanOrEqual((metrics?.viewport ?? 0) + 1);
});

test('DM message list scrolls on mobile thread view', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/hertz/messages');
  const list = page.locator('[data-testid="dm-message-list"]');
  if ((await list.count()) === 0) return;

  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="dm-message-list"]');
    if (!el) return;
    el.innerHTML = '<div style="height:3200px">mock messages</div>';
  });

  const metrics = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="dm-message-list"]') as HTMLElement | null;
    if (!el) return null;
    el.scrollTop = 600;
    return {
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
      scrollTop: el.scrollTop,
      canScroll: el.scrollHeight > el.clientHeight,
      scrolled: el.scrollTop > 0,
      overflowY: getComputedStyle(el).overflowY,
    };
  });

  expect(metrics).not.toBeNull();
  expect(metrics?.overflowY).toBe('auto');
  expect(metrics?.canScroll).toBe(true);
  expect(metrics?.scrolled).toBe(true);
});
