import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'docs', 'review-replays');
const baseURL =
  process.env.REVIEW_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.DOMAIN ? `https://${process.env.DOMAIN}` : 'https://horizon.cloudnexify.com');
const route = process.env.REVIEW_REPLAY_ROUTE || '/hertz';
const seconds = Number(process.env.REVIEW_REPLAY_SECONDS || '30');
const headed = process.env.REVIEW_REPLAY_HEADED === '1';
const rrwebPath = path.join(rootDir, 'node_modules', 'rrweb', 'dist', 'rrweb-all.min.js');

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function replayHTML(jsonFileName) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Horizon Review Replay</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/rrweb@2.0.0-alpha.4/dist/rrweb.min.css" />
  <style>
    body { margin: 0; background: #080808; color: #f5f5f5; font-family: system-ui, sans-serif; }
    header { padding: 12px 16px; border-bottom: 1px solid #164e35; }
    #player { min-height: calc(100vh - 54px); }
  </style>
</head>
<body>
  <header>Horizon review replay: ${jsonFileName}</header>
  <div id="player"></div>
  <script src="https://cdn.jsdelivr.net/npm/rrweb@2.0.0-alpha.4/dist/rrweb.min.js"></script>
  <script>
    fetch('./${jsonFileName}')
      .then((response) => response.json())
      .then((events) => {
        new rrweb.Replayer(events, { root: document.getElementById('player') }).play();
      });
  </script>
</body>
</html>
`;
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const events = [];
  const browser = await chromium.launch({ headless: !headed });
  const context = await browser.newContext({
    colorScheme: 'dark',
    recordVideo: { dir: outputDir },
    viewport: { width: 1440, height: 950 },
  });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: false });

  const id = stamp();
  const jsonFileName = `${id}-events.json`;
  const htmlFileName = `${id}-player.html`;
  const traceFileName = `${id}-trace.zip`;

  try {
    const page = await context.newPage();
    await page.exposeFunction('__reviewReplayEmit', (event) => {
      events.push(event);
    });
    await page.goto(new URL(route, baseURL).toString(), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.addScriptTag({ path: rrwebPath });
    await page.evaluate(() => {
      if (!window.rrweb?.record) {
        throw new Error('rrweb recorder is not available on window');
      }

      window.__reviewReplayStop = window.rrweb.record({
        emit(event) {
          window.__reviewReplayEmit(event);
        },
        maskAllInputs: true,
        slimDOMOptions: {
          script: true,
          comment: true,
        },
      });
    });

    console.log(`Recording ${route} for ${seconds}s. Set REVIEW_REPLAY_HEADED=1 for manual headed review.`);
    await page.waitForTimeout(seconds * 1000);
    await page.evaluate(() => {
      if (typeof window.__reviewReplayStop === 'function') window.__reviewReplayStop();
    });

    await writeFile(path.join(outputDir, jsonFileName), JSON.stringify(events, null, 2), 'utf8');
    await writeFile(path.join(outputDir, htmlFileName), replayHTML(jsonFileName), 'utf8');
    await context.tracing.stop({ path: path.join(outputDir, traceFileName) });
  } finally {
    await browser.close();
  }

  console.log(`Replay events: docs/review-replays/${jsonFileName}`);
  console.log(`Replay player: docs/review-replays/${htmlFileName}`);
  console.log(`Playwright trace: docs/review-replays/${traceFileName}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
