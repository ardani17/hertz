#!/usr/bin/env bash
# Setup PostgreSQL di host (sekali saja). Butuh sudo.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "ERROR: .env tidak ditemukan."
  exit 1
fi

# shellcheck disable=SC1091
set +H
set -a
source .env
set +a

: "${POSTGRES_DB:?POSTGRES_DB kosong}"
: "${POSTGRES_USER:?POSTGRES_USER kosong}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD kosong}"

echo "==> Menyalakan PostgreSQL..."
sudo systemctl enable --now postgresql

echo "==> Membuat user & database (jika belum ada)..."
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${POSTGRES_USER}') THEN
    CREATE ROLE ${POSTGRES_USER} LOGIN PASSWORD '${POSTGRES_PASSWORD}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${POSTGRES_DB}')\gexec
GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_USER};
SQL

echo "==> Migrasi + seed data..."
bash "$ROOT/scripts/seed-all.sh"

echo "==> Selesai. Jalankan: bash scripts/start-local.sh"
