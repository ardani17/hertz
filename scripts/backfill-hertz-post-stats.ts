import { query } from '../shared/db';

const apply = process.argv.includes('--apply');
const batchArg = process.argv.find((arg) => arg.startsWith('--batch='));
const batch = Number(batchArg?.split('=')[1] ?? 1000);

async function main() {
  const rows = await query<{ post_id: string; comment_count: string; pulse_count: string; repost_count: string; view_count: string }>(
    `SELECT p.id AS post_id,
            COALESCE(c.comment_count, 0)::text AS comment_count,
            COALESCE(pl.pulse_count, 0)::text AS pulse_count,
            COALESCE(rp.repost_count, 0)::text AS repost_count,
            COALESCE(vc.view_count, 0)::text AS view_count
     FROM hertz_posts p
     LEFT JOIN LATERAL (
       SELECT COUNT(*) AS comment_count FROM hertz_comments c
       WHERE c.post_id = p.id AND c.status = 'visible' AND c.deleted_at IS NULL
     ) c ON true
     LEFT JOIN LATERAL (
       SELECT COUNT(*) AS pulse_count FROM hertz_reactions r
       WHERE r.post_id = p.id AND r.type = 'pulse' AND r.deleted_at IS NULL
     ) pl ON true
     LEFT JOIN LATERAL (
       SELECT COUNT(*) AS repost_count FROM hertz_reposts r
       WHERE r.original_post_id = p.id AND r.deleted_at IS NULL
     ) rp ON true
     LEFT JOIN LATERAL (SELECT COUNT(*) AS view_count FROM hertz_views v WHERE v.post_id = p.id) vc ON true
     WHERE NOT EXISTS (SELECT 1 FROM hertz_post_stats s WHERE s.post_id = p.id)
     ORDER BY p.id
     LIMIT $1`,
    [batch],
  );

  if (rows.rows.length === 0) {
    console.log(apply ? 'Backfill selesai — tidak ada post tanpa cache.' : 'Dry-run: tidak ada post tanpa cache.');
    return 0;
  }

  for (const row of rows.rows) {
    const sql = `INSERT INTO hertz_post_stats (post_id, comment_count, pulse_count, repost_count, view_count, updated_at)
                 VALUES ($1, $2, $3, $4, $5, NOW())
                 ON CONFLICT (post_id) DO UPDATE SET
                   comment_count = EXCLUDED.comment_count,
                   pulse_count = EXCLUDED.pulse_count,
                   repost_count = EXCLUDED.repost_count,
                   view_count = EXCLUDED.view_count,
                   updated_at = NOW()`;
    if (apply) {
      await query(sql, [row.post_id, row.comment_count, row.pulse_count, row.repost_count, row.view_count]);
    } else {
      console.log('[dry-run]', row.post_id, row.comment_count, row.pulse_count, row.repost_count, row.view_count);
    }
  }

  return rows.rows.length;
}

async function run() {
  let total = 0;
  for (;;) {
    const count = await main();
    if (!apply || count === 0) break;
    total += count;
    console.log(`[batch] ${count} baris (total ${total})`);
  }
  if (apply && total > 0) console.log(`Backfill apply selesai. Total UPSERT: ${total}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
