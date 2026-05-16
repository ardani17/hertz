import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const defaultBaseURL =
  process.env.REVIEW_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.DOMAIN ? `https://${process.env.DOMAIN}` : 'https://horizon.cloudnexify.com');

const defaultPages = [
  ['landing', '/'],
  ['hertz-feed', '/hertz'],
  ['hertz-profile', '/hertz/profile'],
  ['hertz-messages', '/hertz/messages'],
  ['outlook', '/outlook'],
  ['blog', '/blog'],
  ['tools', '/tools'],
];

const defaultViewports = [
  ['desktop-1440', 1440, 950],
  ['tablet-768', 768, 1024],
  ['mobile-390', 390, 844],
  ['mobile-320', 320, 740],
];

const args = new Set(process.argv.slice(2));
const updateBaseline = args.has('--update');
const baseURL = readArg('--base-url') || defaultBaseURL;
const pages = parsePages(readArg('--routes')) || defaultPages;
const viewports = parseViewports(readArg('--viewports')) || defaultViewports;
const snapshotRoot = path.join(rootDir, 'docs', 'review-snapshots');
const currentDir = path.join(snapshotRoot, 'latest');
const baselineDir = path.join(snapshotRoot, 'baseline');

function readArg(name) {
  const prefix = `${name}=`;
  const item = process.argv.slice(2).find((value) => value.startsWith(prefix));
  return item ? item.slice(prefix.length) : '';
}

function parsePages(value) {
  if (!value) return null;
  return value.split(',').filter(Boolean).map((route) => [slugify(route), route]);
}

function parseViewports(value) {
  if (!value) return null;
  return value.split(',').filter(Boolean).map((item) => {
    const [name, size] = item.split(':');
    const [width, height] = size.split('x').map(Number);
    return [name, width, height];
  });
}

function slugify(value) {
  return value.replace(/^\/$/, 'landing').replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
}

function makeURL(route) {
  return new URL(route, baseURL).toString();
}

function makeFileName(pageName, viewportName) {
  return `${pageName}-${viewportName}.txt`;
}

function containsToken(className, token) {
  return String(className || '').toLowerCase().includes(token.toLowerCase());
}

export function normalizeSnapshotText({ tagName, className, ancestorClassName, text }) {
  const normalizedTag = String(tagName || '').toLowerCase();
  const combinedClassName = `${className || ''} ${ancestorClassName || ''}`;

  if (containsToken(className, 'marketSource')) {
    return text.replace(/Update\s+\d{1,2}[.:]\d{2}\s+WIB/g, 'Update [time] WIB');
  }

  const isMarketValue =
    containsToken(combinedClassName, 'marketRow') ||
    containsToken(combinedClassName, 'mobileMarketItem');

  if (!isMarketValue) return text;
  if (normalizedTag === 'b' || normalizedTag === 'span') return '[market-price]';
  if (normalizedTag === 'em') return '[market-change]';
  return text;
}

async function captureOutline(page) {
  return page.evaluate(() => {
    const ignoredTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);
    const importantAttrs = ['id', 'class', 'role', 'aria-label', 'aria-expanded', 'href', 'alt', 'title', 'type'];

    function compact(value) {
      return String(value || '').replace(/\s+/g, ' ').trim();
    }

    function describe(element) {
      const attrs = importantAttrs
        .map((name) => {
          const value = element.getAttribute(name);
          if (!value) return '';
          if (name === 'href') {
            try {
              const url = new URL(value, window.location.href);
              return `${name}="${url.pathname}${url.search}"`;
            } catch {
              return `${name}="${compact(value)}"`;
            }
          }
          return `${name}="${compact(value)}"`;
        })
        .filter(Boolean)
        .join(' ');

      return attrs ? `${element.tagName.toLowerCase()} ${attrs}` : element.tagName.toLowerCase();
    }

    function directText(element) {
      const text = Array.from(element.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => compact(node.textContent))
        .filter(Boolean)
        .join(' ')
        .slice(0, 180);

      const ancestorClassName = Array.from(element.parentElement?.classList || []).join(' ');
      const combinedClassName = `${Array.from(element.classList || []).join(' ')} ${ancestorClassName}`;
      if (String(element.className || '').toLowerCase().includes('marketsource')) {
        return text.replace(/Update\s+\d{1,2}[.:]\d{2}\s+WIB/g, 'Update [time] WIB');
      }
      if (combinedClassName.toLowerCase().includes('marketrow') || combinedClassName.toLowerCase().includes('mobilemarketitem')) {
        const tagName = element.tagName.toLowerCase();
        if (tagName === 'b' || tagName === 'span') return '[market-price]';
        if (tagName === 'em') return '[market-change]';
      }

      return text;
    }

    function walk(element, depth, lines) {
      if (ignoredTags.has(element.tagName)) return;
      const text = directText(element);
      const prefix = '  '.repeat(depth);
      lines.push(`${prefix}<${describe(element)}>${text ? ` ${text}` : ''}`);

      for (const child of Array.from(element.children)) {
        walk(child, depth + 1, lines);
      }
    }

    const lines = [];
    walk(document.body, 0, lines);
    return lines.join('\n');
  });
}

function compareLines(before, after) {
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  const max = Math.max(beforeLines.length, afterLines.length);
  const changes = [];

  for (let index = 0; index < max; index += 1) {
    if (beforeLines[index] !== afterLines[index]) {
      changes.push({
        line: index + 1,
        before: beforeLines[index] ?? '',
        after: afterLines[index] ?? '',
      });
    }
    if (changes.length >= 200) break;
  }

  return changes;
}

function renderDiffReport(reports) {
  if (reports.length === 0) {
    return '# DOM Snapshot Diff\n\nTidak ada perubahan dari baseline.\n';
  }

  const body = reports.map((report) => {
    const changes = report.changes
      .map((change) => [
        `Line ${change.line}`,
        `- ${change.before}`,
        `+ ${change.after}`,
      ].join('\n'))
      .join('\n\n');

    return `## ${report.fileName}\n\n${changes}`;
  }).join('\n\n');

  return `# DOM Snapshot Diff\n\n${body}\n`;
}

async function main() {
  await mkdir(currentDir, { recursive: true });
  if (updateBaseline) await mkdir(baselineDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ colorScheme: 'dark' });
  const page = await context.newPage();
  const diffReports = [];

  try {
    for (const [pageName, route] of pages) {
      for (const [viewportName, width, height] of viewports) {
        await page.setViewportSize({ width, height });
        await page.goto(makeURL(route), { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

        const fileName = makeFileName(pageName, viewportName);
        const currentPath = path.join(currentDir, fileName);
        const outline = await captureOutline(page);
        await writeFile(currentPath, `${outline}\n`, 'utf8');

        if (updateBaseline) {
          await writeFile(path.join(baselineDir, fileName), `${outline}\n`, 'utf8');
          continue;
        }

        try {
          const baseline = await readFile(path.join(baselineDir, fileName), 'utf8');
          const changes = compareLines(baseline, `${outline}\n`);
          if (changes.length > 0) diffReports.push({ fileName, changes });
        } catch {
          diffReports.push({
            fileName,
            changes: [{ line: 1, before: '[baseline missing]', after: '[snapshot captured]' }],
          });
        }
      }
    }
  } finally {
    await browser.close();
  }

  const report = renderDiffReport(diffReports);
  await writeFile(path.join(currentDir, 'dom-diff.md'), report, 'utf8');

  if (updateBaseline) {
    console.log(`DOM baseline updated in ${path.relative(rootDir, baselineDir)}`);
    return;
  }

  console.log(`DOM snapshot written to ${path.relative(rootDir, currentDir)}`);
  if (diffReports.length > 0) {
    console.error(`DOM diff found ${diffReports.length} changed snapshot(s). See docs/review-snapshots/latest/dom-diff.md`);
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
