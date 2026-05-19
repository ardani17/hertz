#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

EXPORT_DIR = Path(os.getenv('EXPORT_DIR', '/exports'))
LOG_DIR = Path(os.getenv('LOG_DIR', '/logs'))
HEALTH_FILE = Path(os.getenv('SYNC_HEALTH_FILE', LOG_DIR / 'export-sync-health.json'))
API_BASE_URL = os.getenv('API_BASE_URL', 'http://journal-api:8088').rstrip('/')
TOKEN = os.getenv('INGEST_TOKEN', '')
SYNC_LOGIN = os.getenv('SYNC_LOGIN') or os.getenv('MT5_LOGIN') or '308881'
INTERVAL = int(os.getenv('SYNC_INTERVAL_SECONDS', '10'))
MAX_BYTES = int(os.getenv('SYNC_MAX_BYTES', str(20 * 1024 * 1024)))


def log(message: str) -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    line = f'[{time.strftime("%Y-%m-%dT%H:%M:%S%z")}] {message}'
    print(line, flush=True)
    with (LOG_DIR / 'export-sync.log').open('a', encoding='utf-8') as fh:
        fh.write(line + '\n')


def write_health(**payload) -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    current = {}
    if HEALTH_FILE.exists():
        try:
            current = json.loads(HEALTH_FILE.read_text(encoding='utf-8'))
        except Exception:
            current = {}
    current.update(payload)
    current['updated_ts'] = time.time()
    tmp = HEALTH_FILE.with_suffix('.tmp')
    tmp.write_text(json.dumps(current, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    tmp.replace(HEALTH_FILE)


def post_csv(path: Path) -> bool:
    if not TOKEN:
        raise RuntimeError('INGEST_TOKEN missing')
    size = path.stat().st_size
    if size <= 0:
        log(f'skip empty file {path}')
        return False
    if size > MAX_BYTES:
        raise RuntimeError(f'CSV too large: {size} > {MAX_BYTES}')
    data = path.read_bytes()
    req = urllib.request.Request(
        f'{API_BASE_URL}/api/import/{SYNC_LOGIN}/csv',
        data=data,
        method='POST',
        headers={'X-API-Token': TOKEN, 'Content-Type': 'text/csv'},
    )
    with urllib.request.urlopen(req, timeout=20) as res:
        body = res.read().decode('utf-8', errors='replace')
        ok = 200 <= res.status < 300
        if ok:
            log(f'posted {path.name} bytes={size} status={res.status}')
            write_health(last_ok_ts=time.time(), last_file=str(path), last_size=size, last_response=body[:500], consecutive_errors=0)
            return True
        raise RuntimeError(f'HTTP {res.status}: {body[:500]}')


def main() -> int:
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    log(f'start watcher login={SYNC_LOGIN} export_dir={EXPORT_DIR} api={API_BASE_URL}')
    last_sig: tuple[int, int] | None = None
    consecutive_errors = 0
    while True:
        path = EXPORT_DIR / f'trade_history_{SYNC_LOGIN}.csv'
        try:
            if path.exists():
                stat = path.stat()
                sig = (stat.st_mtime_ns, stat.st_size)
                if sig != last_sig:
                    # Wait briefly so writer can finish atomic-ish copies from weak exporters.
                    time.sleep(0.5)
                    post_csv(path)
                    last_sig = sig
                else:
                    write_health(last_seen_ts=time.time(), last_file=str(path), last_size=stat.st_size)
            else:
                write_health(last_missing_ts=time.time(), expected_file=str(path))
        except Exception as exc:
            consecutive_errors += 1
            log(f'ERROR {type(exc).__name__}: {exc}')
            write_health(last_error_ts=time.time(), last_error=f'{type(exc).__name__}: {exc}', consecutive_errors=consecutive_errors)
            if consecutive_errors >= int(os.getenv('SYNC_EXIT_AFTER_ERRORS', '12')):
                log('too many errors; exiting so Docker can restart this container')
                return 1
        time.sleep(INTERVAL)


if __name__ == '__main__':
    raise SystemExit(main())
