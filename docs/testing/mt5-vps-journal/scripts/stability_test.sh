#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.mt5.yml}"
LOOPS="${LOOPS:-20}"
SLEEP_SECONDS="${SLEEP_SECONDS:-6}"
TOKEN="${INGEST_TOKEN:-change-me-long-random-token}"

log() { printf '[%s] %s\n' "$(date -Is)" "$*"; }

wait_running() {
  local name="$1"
  local deadline=$((SECONDS + 45))
  while (( SECONDS < deadline )); do
    if [[ "$(docker inspect -f '{{.State.Running}}' "$name" 2>/dev/null || true)" == "true" ]]; then
      log "$name is running"
      return 0
    fi
    sleep 2
  done
  log "$name did not return to running state"
  docker inspect "$name" --format '{{json .State}}' || true
  return 1
}

crash_process() {
  local name="$1"
  log "crash simulation: killing PID 1 inside $name (not docker stop/kill)"
  docker exec "$name" sh -lc 'kill -9 1' >/dev/null 2>&1 || true
  wait_running "$name"
}

log "starting stability test loops=$LOOPS sleep=${SLEEP_SECONDS}s compose=$COMPOSE_FILE"

docker compose -f "$COMPOSE_FILE" ps

for i in $(seq 1 "$LOOPS"); do
  log "loop $i/$LOOPS healthz"
  curl -fsS http://127.0.0.1:8088/healthz >/dev/null

  log "loop $i/$LOOPS api status"
  curl -fsS -H "X-API-Token: $TOKEN" http://127.0.0.1:8088/api/status >/tmp/mt5-status.json
  python3 - <<'PY'
import json
print(json.load(open('/tmp/mt5-status.json')))
PY

  if (( i == 5 )); then
    crash_process mt5-export-sync
  fi
  if (( i == 10 )); then
    crash_process mt5-runner
  fi

  docker compose -f "$COMPOSE_FILE" ps
  sleep "$SLEEP_SECONDS"
done

log "final logs"
docker compose -f "$COMPOSE_FILE" logs --tail=80 journal-api mt5-runner export-sync
log "stability test finished"
