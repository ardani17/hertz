#!/usr/bin/env bash
# Jalankan migrasi DB di host (idempotent, pakai schema_migrations).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "ERROR: .env tidak ditemukan."
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

export PGPASSWORD="${POSTGRES_PASSWORD}"
PSQL=(psql -h "${POSTGRES_HOST:-localhost}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -v ON_ERROR_STOP=1)

if ! pg_isready -h "${POSTGRES_HOST:-localhost}" -p "${POSTGRES_PORT:-5432}" >/dev/null 2>&1; then
  echo "ERROR: PostgreSQL tidak merespons."
  exit 1
fi

echo "==> Hertz: menjalankan migrasi..."

"${PSQL[@]}" -c 'CREATE EXTENSION IF NOT EXISTS pgcrypto;' 2>/dev/null || true
"${PSQL[@]}" -c 'CREATE TABLE IF NOT EXISTS schema_migrations (
  filename VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);'

applied=0
for migration_file in "$ROOT"/db/migrations/*.sql; do
  [ -f "$migration_file" ] || continue
  filename=$(basename "$migration_file")
  already=$("${PSQL[@]}" -t -A -c "SELECT COUNT(*) FROM schema_migrations WHERE filename='${filename}'")

  if [ "${already}" != "0" ]; then
    echo "  [SKIP] ${filename}"
    continue
  fi

  echo "  [APPLY] ${filename}"
  "${PSQL[@]}" -f "$migration_file"
  "${PSQL[@]}" -c "INSERT INTO schema_migrations (filename) VALUES ('${filename}')"
  applied=$((applied + 1))
done

echo "==> Selesai. Migrasi baru: ${applied}"
