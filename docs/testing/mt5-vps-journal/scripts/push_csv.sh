#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
ENV_FILE="${ENV_FILE:-$PROJECT_DIR/.env}"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

LOGIN="${1:?usage: scripts/push_csv.sh <login> <csv-path> [base-url]}"
CSV_PATH="${2:?usage: scripts/push_csv.sh <login> <csv-path> [base-url]}"
BASE_URL="${3:-http://${APP_HOST:-127.0.0.1}:${APP_PORT:-8088}}"

curl -fsS \
  -X POST \
  -H "X-API-Token: ${INGEST_TOKEN:?INGEST_TOKEN missing}" \
  --data-binary "@$CSV_PATH" \
  "$BASE_URL/api/import/$LOGIN/csv"
