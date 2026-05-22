import { query } from '../shared/db';

const sampleArg = process.argv.find((arg) => arg.startsWith('--sample='));
const sample = Number(sampleArg?.split('=')[1] ?? 100);
const assert = process.argv.includes('--assert');

async function main() {
  const rows = await query<{ post_id: string; comment_count: string; pulse_count: string; repost_count: string; view_count: string }>(
    `SELECT s.post_id, s.comment_count, s.pulse_count, s.repost_count, s.view_count
     FROM hertz_post_stats s
     ORDER BY RANDOM()
     LIMIT $1`,
    [sample],
  );

  let drift = 0;
  for (const row of rows.rows) {
    const canonical = await query<{
      comment_count: string;
      pulse_count: string;
      repost_count: string;
      view_count: string;
    }>(
      `SELECT
         (SELECT COUNT(*)::text FROM hertz_comments c WHERE c.post_id = $1 AND c.status = 'visible' AND c.deleted_at IS NULL) AS comment_count,
         (SELECT COUNT(*)::text FROM hertz_reactions r WHERE r.post_id = $1 AND r.type = 'pulse' AND r.deleted_at IS NULL) AS pulse_count,
         (SELECT COUNT(*)::text FROM hertz_reposts rp WHERE rp.original_post_id = $1 AND rp.deleted_at IS NULL) AS repost_count,
         (SELECT COUNT(*)::text FROM hertz_views v WHERE v.post_id = $1) AS view_count`,
      [row.post_id],
    );
    const c = canonical.rows[0];
    if (!c) continue;
    const mismatch =
      Number(row.comment_count) !== Number(c.comment_count)
      || Number(row.pulse_count) !== Number(c.pulse_count)
      || Number(row.repost_count) !== Number(c.repost_count)
      || Number(row.view_count) !== Number(c.view_count);
    if (mismatch) {
      drift += 1;
      console.warn('[drift]', row.post_id, { cache: row, canonical: c });
    }
  }

  console.log(`Reconcile sample=${rows.rows.length} drift=${drift}`);
  if (assert && drift > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
