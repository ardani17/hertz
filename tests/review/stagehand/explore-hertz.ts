/**
 * Exploratory AI browser review (Stagehand v3).
 *
 * Usage:
 *   REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:stagehand
 *
 * Optional: BROWSERBASE_API_KEY + BROWSERBASE_PROJECT_ID, OPENAI_API_KEY
 */
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

loadEnv({ path: resolve(process.cwd(), '.env') });

const baseURL =
  process.env.REVIEW_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.DOMAIN ? `https://${process.env.DOMAIN}` : 'https://horizon.cloudnexify.com');

async function main() {
  const { Stagehand } = await import('@browserbasehq/stagehand');

  const stagehand = new Stagehand({
    env: process.env.BROWSERBASE_API_KEY ? 'BROWSERBASE' : 'LOCAL',
    verbose: 1,
  });

  await stagehand.init();
  const page = stagehand.context.pages()[0];

  console.log(`[stagehand] Opening ${baseURL}/hertz`);
  await page.goto(`${baseURL}/hertz`, { waitUntil: 'domcontentloaded' });

  await stagehand.act(
    'Scroll slightly and describe whether the feed shows posts, an empty state, or an error message',
  );

  console.log('[stagehand] Done.');
  await stagehand.close();
}

main().catch((error) => {
  console.error('[stagehand] failed:', error.message);
  process.exit(1);
});
