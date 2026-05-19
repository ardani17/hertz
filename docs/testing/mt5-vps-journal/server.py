#!/usr/bin/env python3
from __future__ import annotations

import base64
import hmac
import json
import os
from http import HTTPStatus
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse

from vps_journal.config import DATA_DIR, PROJECT_DIR, PUBLIC_DIR, load_dotenv
from vps_journal.dashboard import build_dashboard
from vps_journal.importer import convert

ENV = load_dotenv()
APP_HOST = ENV.get('APP_HOST', '127.0.0.1')
APP_PORT = int(ENV.get('APP_PORT', '8088'))
INGEST_TOKEN = ENV.get('INGEST_TOKEN', '')
DASHBOARD_USER = ENV.get('DASHBOARD_USER', '')
DASHBOARD_PASSWORD = ENV.get('DASHBOARD_PASSWORD', '')


def consteq(a: str, b: str) -> bool:
    return hmac.compare_digest(a.encode(), b.encode())


class Handler(SimpleHTTPRequestHandler):
    server_version = 'MT5VPSJournal/0.1'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC_DIR), **kwargs)

    def log_message(self, fmt, *args):
        Path(PROJECT_DIR / 'logs').mkdir(exist_ok=True)
        with (PROJECT_DIR / 'logs' / 'server.log').open('a', encoding='utf-8') as fh:
            fh.write('%s - %s\n' % (self.log_date_time_string(), fmt % args))

    def _send_json(self, status: int, payload: dict):
        body = json.dumps(payload, indent=2, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _authorized_browser(self) -> bool:
        if not DASHBOARD_USER and not DASHBOARD_PASSWORD:
            return True
        header = self.headers.get('Authorization', '')
        if not header.startswith('Basic '):
            return False
        try:
            decoded = base64.b64decode(header.split(' ', 1)[1]).decode('utf-8')
        except Exception:
            return False
        username, _, password = decoded.partition(':')
        return consteq(username, DASHBOARD_USER) and consteq(password, DASHBOARD_PASSWORD)

    def _require_browser_auth(self) -> bool:
        if self._authorized_browser():
            return True
        self.send_response(HTTPStatus.UNAUTHORIZED)
        self.send_header('WWW-Authenticate', 'Basic realm="Trading Journal"')
        self.end_headers()
        return False

    def _authorized_ingest(self) -> bool:
        token = self.headers.get('X-API-Token', '')
        return bool(INGEST_TOKEN) and consteq(token, INGEST_TOKEN)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/healthz':
            return self._send_json(200, {'ok': True, 'project': str(PROJECT_DIR)})
        if parsed.path == '/api/status':
            if not self._authorized_ingest():
                return self._send_json(401, {'ok': False, 'error': 'unauthorized'})
            return self._send_json(200, {
                'ok': True,
                'history_files': sorted(p.name for p in DATA_DIR.glob('*-history.json')),
                'dashboard_exists': (PUBLIC_DIR / 'dashboard.html').exists(),
            })
        if not self._require_browser_auth():
            return
        if parsed.path in {'/', '/dashboard'}:
            self.path = '/dashboard.html'
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        parts = [p for p in parsed.path.split('/') if p]
        if len(parts) != 4 or parts[:2] != ['api', 'import'] or parts[3] != 'csv':
            return self._send_json(404, {'ok': False, 'error': 'not found'})
        if not self._authorized_ingest():
            return self._send_json(401, {'ok': False, 'error': 'unauthorized'})
        login = parts[2]
        if not login.isdigit() or len(login) > 32:
            return self._send_json(400, {'ok': False, 'error': 'invalid login'})
        length = int(self.headers.get('Content-Length', '0') or '0')
        if length <= 0 or length > 20 * 1024 * 1024:
            return self._send_json(413, {'ok': False, 'error': 'invalid body size'})
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        csv_path = DATA_DIR / f'trade_history_{login}.csv'
        history_path = DATA_DIR / f'{login}-history.json'
        csv_path.write_bytes(self.rfile.read(length))
        history = convert(csv_path)
        history_path.write_text(json.dumps(history, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
        dashboard = build_dashboard()
        return self._send_json(200, {'ok': True, 'login': login, 'history': str(history_path), 'dashboard': dashboard})


def main():
    build_dashboard()
    print(f'Serving {PUBLIC_DIR} on http://{APP_HOST}:{APP_PORT}')
    ThreadingHTTPServer((APP_HOST, APP_PORT), Handler).serve_forever()


if __name__ == '__main__':
    main()
