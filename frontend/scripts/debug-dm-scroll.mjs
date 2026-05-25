import { chromium, devices } from '@playwright/test';

const browser = await chromium.launch();
const context = await browser.newContext({ ...devices['iPhone 13'] });
const page = await context.newPage();
await page.goto('https://hertz.cloudnexify.com/hertz/messages', { waitUntil: 'networkidle' });

const metrics = await page.evaluate(() => {
  const q = (sel) => document.querySelector(sel);
  const cs = (el) => (el ? getComputedStyle(el) : null);
  const list = q('[data-testid="dm-message-list"]');
  const thread = q('section[aria-label="Percakapan aktif"]');
  const layout = q('[data-testid="dm-layout"]');
  const shell = q('[class*="pageBodyFill"]');
  const content = q('[class*="contentPageFill"]');
  const main = q('main');

  if (list) {
    list.innerHTML =
      '<div class="messageStack" style="height:3200px;background:linear-gradient(red,blue)">mock</div>';
  }

  const describe = (el, label) => {
    if (!el) return { label, missing: true };
    const s = cs(el);
    return {
      label,
      tag: el.tagName,
      cls: typeof el.className === 'string' ? el.className.slice(0, 80) : '',
      height: s.height,
      maxHeight: s.maxHeight,
      minHeight: s.minHeight,
      overflow: s.overflow,
      overflowY: s.overflowY,
      flex: s.flex,
      display: s.display,
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
    };
  };

  return {
    viewport: { w: innerWidth, h: innerHeight, dvh: visualViewport?.height },
    main: describe(main, 'main'),
    content: describe(content, 'contentPageFill'),
    pageBody: describe(shell, 'pageBodyFill'),
    dmPageShell: describe(layout?.parentElement, 'dmPageShell'),
    layout: describe(layout, 'dmLayout'),
    thread: describe(thread, 'thread'),
    threadBody: describe(list?.parentElement, 'threadBody'),
    list: describe(list, 'messages'),
    listScrollable: list ? list.scrollHeight > list.clientHeight : null,
  };
});

console.log(JSON.stringify(metrics, null, 2));

// Attempt programmatic scroll
const scrollResult = await page.evaluate(() => {
  const list = document.querySelector('[data-testid="dm-message-list"]');
  if (!list) return { error: 'no list' };
  const before = list.scrollTop;
  list.scrollTop = 500;
  return { before, after: list.scrollTop, changed: list.scrollTop !== before };
});
console.log('scrollResult', JSON.stringify(scrollResult));

await browser.close();
