#!/usr/bin/env bash
# Jalankan Horizon tanpa Docker (dev mode, hot reload).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "ERROR: .env tidak ditemukan. Salin dari .env.example dulu."
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

if [ "${POSTGRES_HOST:-db}" = "db" ]; then
  echo "WARN: POSTGRES_HOST=db (Docker). Untuk tanpa Docker, set POSTGRES_HOST=localhost di .env"
fi

if ! pg_isready -h "${POSTGRES_HOST:-localhost}" -p "${POSTGRES_PORT:-5432}" >/dev/null 2>&1; then
  echo "ERROR: PostgreSQL tidak merespons di ${POSTGRES_HOST:-localhost}:${POSTGRES_PORT:-5432}"
  echo "  Jalankan: sudo systemctl start postgresql"
  echo "  Lalu buat DB/user jika belum ada (lihat scripts/setup-local-postgres.sh)"
  exit 1
fi

export PORT="${FRONTEND_HOST_PORT:-3888}"

echo "Starting frontend on http://127.0.0.1:${PORT}"
echo "Starting bot on http://127.0.0.1:${BOT_PORT:-4000}"
echo "Tekan Ctrl+C untuk stop."

trap 'kill 0' EXIT INT TERM

npm run dev:bot &
npm run dev:frontend &
wait
