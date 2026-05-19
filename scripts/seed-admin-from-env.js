const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const rootDir = path.resolve(__dirname, '..');

function parseEnvFile(envText) {
  const entries = {};
  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    entries[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return entries;
}

function loadConfig() {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env file not found');
  }
  const env = { ...parseEnvFile(fs.readFileSync(envPath, 'utf8')), ...process.env };
  const connectionString =
    env.DATABASE_URL ||
    `postgresql://${encodeURIComponent(env.POSTGRES_USER)}:${encodeURIComponent(env.POSTGRES_PASSWORD)}@${env.POSTGRES_HOST}:${env.POSTGRES_PORT || '5432'}/${env.POSTGRES_DB}`;

  return {
    connectionString,
    adminUsername: env.ADMIN_USERNAME || 'admin',
    adminPassword: env.ADMIN_PASSWORD,
  };
}

async function run() {
  const { connectionString, adminUsername, adminPassword } = loadConfig();
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD tidak di-set di .env');
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const result = await client.query(
      `INSERT INTO users (telegram_id, username, password_hash, role, credit_balance)
       VALUES (0, $1, $2, 'admin', 0)
       ON CONFLICT (telegram_id) DO UPDATE
       SET username = EXCLUDED.username,
           password_hash = EXCLUDED.password_hash,
           role = 'admin'`,
      [adminUsername, passwordHash],
    );

    console.log(
      `admin user "${adminUsername}" ready (rows affected: ${result.rowCount ?? 'ok'})`,
    );
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(`admin seed failed: ${error.message}`);
  process.exit(1);
});
