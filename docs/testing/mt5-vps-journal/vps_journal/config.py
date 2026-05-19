from __future__ import annotations

import os
from pathlib import Path
from typing import Any
import json

PROJECT_DIR = Path(os.getenv('TRADING_DIR', Path(__file__).resolve().parents[1])).resolve()
DATA_DIR = Path(os.getenv('DATA_DIR', PROJECT_DIR / 'data')).resolve()
PUBLIC_DIR = Path(os.getenv('PUBLIC_DIR', PROJECT_DIR / 'public')).resolve()
ACCOUNTS_PATH = Path(os.getenv('ACCOUNTS_PATH', PROJECT_DIR / 'accounts.json')).resolve()
ENV_PATH = Path(os.getenv('ENV_PATH', PROJECT_DIR / '.env')).resolve()


def load_dotenv(path: Path = ENV_PATH) -> dict[str, str]:
    values: dict[str, str] = {}
    if path.exists():
        for raw in path.read_text(encoding='utf-8').splitlines():
            line = raw.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, value = line.split('=', 1)
            key = key.strip()
            value = value.strip()
            if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
                value = value[1:-1]
            if key:
                values[key] = value
    return values | {k: v for k, v in os.environ.items() if k in values or k.startswith(('APP_', 'DASHBOARD_', 'INGEST_', 'MT5_', 'WINE', 'DISPLAY'))}


def env_bool(env: dict[str, str], key: str, default: bool = False) -> bool:
    raw = env.get(key)
    if raw is None or raw == '':
        return default
    return raw.strip().lower() in {'1', 'true', 'yes', 'y', 'on'}


def load_accounts(path: Path = ACCOUNTS_PATH) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    items = json.loads(path.read_text(encoding='utf-8'))
    out: list[dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        if item.get('enabled', True):
            login = str(item.get('login') or '').strip()
            if login:
                out.append(item)
    return out


def account_map() -> dict[str, dict[str, Any]]:
    return {str(item['login']): item for item in load_accounts()}
