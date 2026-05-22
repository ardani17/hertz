import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { closePool, query } from '../shared/db';

const MIGRATION_FILE = '015_create_hertz_post_stats.sql';

async function main() {
  const exists = await query<{ reg: string }>(
    `SELECT to_regclass('public.hertz_post_stats')::text AS reg`,
  );
  if (exists.rows[0]?.reg) {
    console.log('Tabel hertz_post_stats sudah ada — skip DDL.');
  } else {
    const sqlPath = join(process.cwd(), 'db/migrations', MIGRATION_FILE);
    const sql = readFileSync(sqlPath, 'utf8');
    await query(sql);
    console.log('DDL hertz_post_stats diterapkan.');
  }

  await query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  );
  await query(
    `INSERT INTO schema_migrations (filename) VALUES ($1)
     ON CONFLICT (filename) DO NOTHING`,
    [MIGRATION_FILE],
  );

  const count = await query<{ n: string }>(`SELECT COUNT(*)::text AS n FROM hertz_post_stats`);
  console.log(`hertz_post_stats rows: ${count.rows[0]?.n ?? '0'}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => closePool());
