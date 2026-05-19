#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import random
from datetime import datetime, timedelta
from pathlib import Path

HEADER = ['time', 'position_id', 'symbol', 'type', 'entry', 'volume', 'price', 'profit', 'commission', 'swap', 'fee', 'comment', 'account_login']


def write_mock_csv(path: Path, login: str, count: int, seed: int) -> None:
    rng = random.Random(seed)
    path.parent.mkdir(parents=True, exist_ok=True)
    start = datetime.now().replace(hour=8, minute=0, second=0, microsecond=0) - timedelta(days=3)
    rows = []
    rows.append({
        'time': start.strftime('%Y.%m.%d %H:%M:%S'),
        'position_id': '',
        'symbol': '',
        'type': 'BALANCE',
        'entry': '',
        'volume': '',
        'price': '',
        'profit': '1500.00',
        'commission': '0',
        'swap': '0',
        'fee': '0',
        'comment': 'Mock funding',
        'account_login': login,
    })
    symbols = ['XAUUSD#', 'GBPUSD#', 'EURUSD#']
    for idx in range(1, count + 1):
        open_time = start + timedelta(minutes=idx * rng.randint(17, 53))
        close_time = open_time + timedelta(minutes=rng.randint(8, 90))
        symbol = rng.choices(symbols, weights=[8, 1, 1], k=1)[0]
        side = rng.choice(['BUY', 'SELL'])
        lot = rng.choice([0.01, 0.02, 0.03, 0.05, 0.10, 0.20])
        entry = round(2300 + rng.uniform(-40, 40), 3) if symbol == 'XAUUSD#' else round(1 + rng.uniform(-0.05, 0.05), 5)
        exit_price = round(entry + rng.uniform(-3, 3), 3) if symbol == 'XAUUSD#' else round(entry + rng.uniform(-0.003, 0.003), 5)
        profit = round(rng.gauss(1.2, 7.5) * (lot / 0.02), 2)
        pos_id = f'{login}{idx:05d}'
        rows.append({
            'time': open_time.strftime('%Y.%m.%d %H:%M:%S'),
            'position_id': pos_id,
            'symbol': symbol,
            'type': side,
            'entry': 'IN',
            'volume': f'{lot:.2f}',
            'price': str(entry),
            'profit': '0',
            'commission': '-0.03',
            'swap': '0',
            'fee': '0',
            'comment': 'mock open',
            'account_login': login,
        })
        rows.append({
            'time': close_time.strftime('%Y.%m.%d %H:%M:%S'),
            'position_id': pos_id,
            'symbol': symbol,
            'type': side,
            'entry': 'OUT',
            'volume': f'{lot:.2f}',
            'price': str(exit_price),
            'profit': str(profit),
            'commission': '-0.03',
            'swap': '0',
            'fee': '0',
            'comment': 'mock close',
            'account_login': login,
        })
    with path.open('w', newline='', encoding='utf-8') as fh:
        writer = csv.DictWriter(fh, fieldnames=HEADER)
        writer.writeheader()
        writer.writerows(rows)
    print(path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--login', default='400241')
    parser.add_argument('--out', default='data/trade_history_400241.csv')
    parser.add_argument('--count', type=int, default=24)
    parser.add_argument('--seed', type=int, default=4241)
    args = parser.parse_args()
    write_mock_csv(Path(args.out), args.login, args.count, args.seed)


if __name__ == '__main__':
    main()
