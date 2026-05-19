#!/usr/bin/env bash
# Migrasi + seed dasar + demo HERTZ + admin dari .env
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

if ! pg_isready -h "${POSTGRES_HOST:-localhost}" -p "${POSTGRES_PORT:-5432}" >/dev/null 2>&1; then
  echo "ERROR: PostgreSQL tidak jalan di ${POSTGRES_HOST:-localhost}:${POSTGRES_PORT:-5432}"
  echo "  Jalankan dulu: sudo bash scripts/setup-local-postgres.sh"
  echo "  Atau: sudo systemctl start postgresql"
  exit 1
fi

echo "==> 1/3 Migrasi schema..."
bash "$ROOT/scripts/run-migrations-local.sh"

echo "==> 2/3 Admin user dari .env (ADMIN_USERNAME / ADMIN_PASSWORD)..."
node "$ROOT/scripts/seed-admin-from-env.js"

echo "==> 3/3 Demo seeds (db/seeds/*.sql)..."
npm run db:seed

echo "==> Seed selesai."
