#!/usr/bin/env python3
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from .config import DATA_DIR, PUBLIC_DIR, PROJECT_DIR, account_map

MONTH_NAMES_ID = {
    1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April', 5: 'Mei', 6: 'Juni',
    7: 'Juli', 8: 'Agustus', 9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember',
}


def month_label(month_key: str) -> str:
    year, month = month_key.split('-')
    return f"{MONTH_NAMES_ID[int(month)]} {year}"


def money(value) -> str:
    sign = '+' if value > 0 else ''
    return f'{sign}{value:.2f}'


def script_json(data: dict) -> str:
    return (
        json.dumps(data, ensure_ascii=False)
        .replace('&', '\\u0026')
        .replace('<', '\\u003c')
        .replace('>', '\\u003e')
        .replace('\u2028', '\\u2028')
        .replace('\u2029', '\\u2029')
    )


def empty_summary(login: str) -> dict:
    return {
        'account_login': login,
        'total_closed_positions': 0,
        'winning_positions': 0,
        'losing_positions': 0,
        'win_rate': 0.0,
        'net_profit': 0.0,
        'total_commission': 0.0,
        'total_swap': 0.0,
        'balance_adjustments_total': 0.0,
        'deposit_total': 0.0,
        'withdrawal_total': 0.0,
        'estimated_balance': 0.0,
        'symbols': [],
        'median_lot': 0.0,
        'max_lot': 0.0,
        'by_symbol': {},
        'by_day': {},
        'busiest_hours': [],
        'max_loss_streak': 0,
        'discipline_flags': [],
        'top_wins': [],
        'top_losses': [],
        'recent_positions': [],
        'recent_balance_events': [],
        'month_keys': [],
    }


def empty_history(meta: dict) -> dict:
    login = str(meta.get('login') or meta.get('id') or '').strip()
    month_key = datetime.now().strftime('%Y-%m')
    summary = empty_summary(login)
    return {
        'source_csv': 'waiting for first MT5 export',
        'source_mtime': 'waiting for first MT5 export',
        'summary': summary,
        'months': {month_key: {'summary': summary, 'positions': [], 'balance_events': []}},
        'positions': [],
        'balance_events': [],
    }


def daily_breakdown_from_summary(summary: dict) -> list[dict]:
    out = []
    for date_key, item in sorted(summary.get('by_day', {}).items()):
        out.append({
            'date': date_key,
            'count': item['count'],
            'net': item['net_profit'],
            'winRate': item['win_rate'],
            'maxLot': item['max_lot'],
            'read': build_day_read(item),
        })
    return out


def build_day_read(day: dict) -> str:
    if day['count'] >= 15 and day['net_profit'] < 0:
        return 'Frekuensi tinggi dan hasil negatif.'
    if day['count'] >= 10 and day['max_lot'] >= 0.1:
        return 'Trade ramai dan size mulai agresif.'
    if day['net_profit'] > 0 and day['count'] <= 8:
        return 'Lebih rapi, profit masih kepake.'
    if day['net_profit'] < 0:
        return 'Hari merah, perlu review eksekusi.'
    return 'Aktivitas masih normal.'


def by_symbol_list(summary: dict) -> list[dict]:
    items = []
    for symbol, item in summary.get('by_symbol', {}).items():
        items.append({
            'symbol': symbol,
            'count': item['count'],
            'net': item['net_profit'],
            'winRate': item['win_rate'],
            'maxLot': item['max_lot'],
        })
    return sorted(items, key=lambda x: (-x['count'], -x['net']))


def quick_read(meta: dict, summary: dict, by_symbol: list[dict]) -> list[str]:
    notes = []
    status = (meta.get('status') or '').lower()
    if 'drawdown' in status or 'blown' in status or 'hangus' in status:
        notes.append('Ini akun review drawdown/hangus — fokusnya bukan performa akhir, tapi pola rusak yang bikin akun jebol.')
    main_instrument = meta.get('mainInstrument')
    main_row = next((row for row in by_symbol if row['symbol'] == main_instrument), None)
    if main_row:
        notes.append(f"{main_instrument} masih jadi core edge: {money(main_row['net'])} dari {main_row['count']} posisi.")
    non_focus_losses = [row for row in by_symbol if row['symbol'] != main_instrument and row['net'] < 0]
    if non_focus_losses:
        joined = ', '.join(f"{row['symbol']} {money(row['net'])}" for row in non_focus_losses[:3])
        notes.append(f"Pair non-fokus masih drag hasil: {joined}.")
    if summary.get('max_lot', 0) >= max(0.10, round(summary.get('median_lot', 0) * 4, 2)):
        notes.append(f"Lonjakan size masih bahaya: median lot {summary.get('median_lot', 0):.2f} vs max lot {summary.get('max_lot', 0):.2f}.")
    busiest = summary.get('busiest_hours', [])
    if busiest:
        notes.append(f"Jam paling padat: {busiest[0]['hour']} dengan {busiest[0]['count']} posisi.")
    if not notes:
        notes.append('Belum cukup data buat baca pola yang kuat.')
    return notes[:4]


def month_payload(meta: dict, month_key: str, month_data: dict) -> dict:
    summary = month_data['summary']
    by_symbol = by_symbol_list(summary)
    return {
        'key': month_key,
        'label': month_label(month_key),
        'summary': summary,
        'dailyBreakdown': daily_breakdown_from_summary(summary),
        'bySymbol': by_symbol,
        'positions': month_data['positions'],
        'recentPositions': month_data['positions'][-20:],
        'balanceEvents': month_data.get('balance_events', []),
        'disciplineFlags': summary.get('discipline_flags', []),
        'topWins': summary.get('top_wins', []),
        'topLosses': summary.get('top_losses', []),
        'quickRead': quick_read(meta, summary, by_symbol),
    }


def account_payload(meta: dict, history: dict, history_path: Path | None) -> dict:
    login = str(history['summary'].get('account_login') or meta.get('login'))
    months = [month_payload(meta, key, value) for key, value in sorted(history.get('months', {}).items(), reverse=True)]
    source_file = f'data/{history_path.name}' if history_path else 'waiting for first MT5 export'
    return {
        'id': login,
        'login': login,
        'label': meta.get('label', login),
        'status': meta.get('status', 'Tracked'),
        'title': meta.get('title', 'Imported history'),
        'notes': meta.get('notes', ''),
        'profile': {
            'traderProfile': meta.get('traderProfile', 'trader'),
            'realLossBudget': meta.get('realLossBudget', '-'),
            'buyingPower': meta.get('buyingPower', '-'),
            'accountStructure': meta.get('accountStructure', '-'),
            'mainInstrument': meta.get('mainInstrument', '-'),
            'mainIssues': meta.get('mainIssues', '-'),
        },
        'overallSummary': history['summary'],
        'months': months,
        'files': [source_file, meta.get('exportCsv', ''), 'journal/2026-05.md', 'reviews/2026-05.md'],
        'footer': f"Last parsed: {history.get('source_mtime', 'unknown')} • Source login {login}",
    }


def build_dashboard() -> dict:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    (PUBLIC_DIR / 'data').mkdir(parents=True, exist_ok=True)

    accounts_meta = account_map()
    order = {login: idx for idx, login in enumerate(accounts_meta.keys())}
    accounts = []
    seen = set()
    for history_path in sorted(DATA_DIR.glob('*-history.json')):
        history = json.loads(history_path.read_text(encoding='utf-8'))
        login = str(history.get('summary', {}).get('account_login') or history_path.name.split('-')[0])
        if login not in accounts_meta:
            continue
        accounts.append(account_payload(accounts_meta[login], history, history_path))
        seen.add(login)
    for login, meta in accounts_meta.items():
        if login not in seen:
            accounts.append(account_payload(meta, empty_history(meta), None))
    accounts.sort(key=lambda item: (order.get(item['login'], 9999), item['login']))

    data = {'generatedAt': datetime.now().isoformat(), 'autoReloadSeconds': 60, 'accounts': accounts}
    template = (PUBLIC_DIR / 'index.template.html').read_text(encoding='utf-8')
    rendered = (
        template
        .replace('__DASHBOARD_CSS__', (PUBLIC_DIR / 'assets' / 'styles.css').read_text(encoding='utf-8'))
        .replace('__DASHBOARD_JS__', (PUBLIC_DIR / 'assets' / 'app.js').read_text(encoding='utf-8'))
        .replace('__DASHBOARD_DATA_JSON__', script_json(data))
    )
    (PROJECT_DIR / 'dashboard.html').write_text(rendered, encoding='utf-8')
    (PUBLIC_DIR / 'dashboard.html').write_text(rendered, encoding='utf-8')
    data_json = json.dumps(data, indent=2, ensure_ascii=False) + '\n'
    (DATA_DIR / 'dashboard-data.json').write_text(data_json, encoding='utf-8')
    (PUBLIC_DIR / 'data' / 'dashboard-data.json').write_text(data_json, encoding='utf-8')
    return {'accounts': [a['login'] for a in accounts], 'dashboard': str(PUBLIC_DIR / 'dashboard.html')}


def main() -> None:
    print(json.dumps(build_dashboard(), indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
