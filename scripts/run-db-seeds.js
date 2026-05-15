const fs = require('fs');
const path = require('path');
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

function loadDatabaseUrl() {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env file not found');
  }

  const envText = fs.readFileSync(envPath, 'utf8');
  const env = { ...parseEnvFile(envText), ...process.env };
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }

  const host = env.POSTGRES_HOST;
  const port = env.POSTGRES_PORT || '5432';
  const database = env.POSTGRES_DB;
  const user = env.POSTGRES_USER;
  const password = env.POSTGRES_PASSWORD;

  if (!host || !database || !user || !password) {
    throw new Error('DATABASE_URL or POSTGRES_* connection values not found in .env');
  }

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

function resolveSeedFiles(args) {
  if (args.length > 0) {
    return args.map((item) => path.resolve(rootDir, item));
  }

  const seedDir = path.join(rootDir, 'db', 'seeds');
  return fs
    .readdirSync(seedDir)
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort()
    .map((fileName) => path.join(seedDir, fileName));
}

async function run() {
  const seedFiles = resolveSeedFiles(process.argv.slice(2));
  const client = new Client({ connectionString: loadDatabaseUrl() });

  await client.connect();
  try {
    for (const seedFile of seedFiles) {
      const sql = fs.readFileSync(seedFile, 'utf8');
      await client.query(sql);
      console.log(`seeded ${path.relative(rootDir, seedFile)}`);
    }
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(`seed failed: ${error.code || error.name}: ${error.message}`);
  process.exit(1);
});
