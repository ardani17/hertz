const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const rootDir = path.resolve(__dirname, '..');

function loadDatabaseUrl() {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env file not found');
  }

  const envText = fs.readFileSync(envPath, 'utf8');
  const match = envText.match(/^DATABASE_URL=(.*)$/m);
  if (!match) {
    throw new Error('DATABASE_URL not found in .env');
  }

  return match[1].trim().replace(/^['"]|['"]$/g, '');
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
