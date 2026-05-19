#!/usr/bin/env python3
# Importer histori MT5.
# Tugas file ini: baca CSV export dari MT5, bedakan cashflow vs trade,
# gabungkan deal IN/OUT menjadi posisi tertutup, lalu hitung summary trading.
import csv
import io
import json
import sys
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from statistics import median

# Format timestamp bawaan export MT5, contoh: 2026.05.14 08:14:20.
TIME_FMT = '%Y.%m.%d %H:%M:%S'
# Tipe deal yang dianggap sebagai funding/withdrawal/adjustment, bukan posisi trading.
CASHFLOW_TYPES = {'BALANCE', 'CREDIT', 'CHARGE', 'CORRECTION', 'BONUS', 'COMMISSION', 'INTEREST'}


def read_mt5_rows(csv_path: Path):
    """Baca CSV MT5 dan normalisasi header.

    Export MT5 kadang UTF-16 tab-delimited, kadang UTF-8 comma-delimited.
    Fungsi ini auto-detect supaya importer tetap jalan di dua format itu.
    """
    raw = csv_path.read_bytes()
    if raw.startswith(b'\xff\xfe'):
        text = raw.decode('utf-16le')
        delimiter = '\t'
    else:
        text = raw.decode('utf-8-sig')
        delimiter = ','

    rows = list(csv.DictReader(io.StringIO(text), delimiter=delimiter))
    normalized = []
    for row in rows:
        clean = {}
        for key, value in row.items():
            clean[(key or '').replace('\ufeff', '')] = value
        normalized.append(clean)
    return normalized


def fnum(value, default=0.0):
    """Konversi value ke float secara aman; nilai kosong/rusak jadi default."""
    try:
        return float(value or default)
    except Exception:
        return float(default)


def parse_time(value: str):
    """Parse timestamp MT5 menjadi object datetime Python."""
    return datetime.strptime(value, TIME_FMT)


def build_balance_events(rows):
    """Ambil event cashflow: deposit, WD, credit, charge, bonus, koreksi."""
    events = []
    for row in rows:
        row_type = (row.get('type') or '').upper()
        if row_type not in CASHFLOW_TYPES:
            continue
        event_time = row.get('time')
        if not event_time:
            continue

        dt = parse_time(event_time)
        amount = round(fnum(row.get('profit')), 2)
        events.append({
            'account_login': row.get('account_login'),
            'time': dt.strftime('%Y-%m-%d %H:%M:%S'),
            'month_key': dt.strftime('%Y-%m'),
            'day_key': dt.strftime('%Y-%m-%d'),
            'type': row_type,
            'amount': amount,
            'comment': row.get('comment') or '',
        })

    events.sort(key=lambda item: item['time'])
    return events


def build_closed_positions(rows):
    """Gabungkan deal MT5 menjadi posisi tertutup.

    MT5 menyimpan trade sebagai deal: entry IN dan exit OUT. Jurnal butuh posisi
    utuh, jadi semua deal dengan position_id yang sama digabung.
    """
    # Ambil hanya row trade BUY/SELL yang punya symbol; cashflow diproses terpisah.
    trade_rows = [r for r in rows if r.get('symbol') and r.get('type') in {'BUY', 'SELL'}]
    # Group berdasarkan position_id agar entry/exit satu posisi bisa digabung.
    grouped = defaultdict(list)
    for row in trade_rows:
        grouped[row['position_id']].append(row)

    positions = []
    for position_id, deals in grouped.items():
        deals.sort(key=lambda r: r.get('time', ''))
        # IN = entry/open, OUT = exit/close. Posisi belum lengkap kalau salah satu kosong.
        ins = [r for r in deals if r.get('entry') == 'IN']
        outs = [r for r in deals if r.get('entry') == 'OUT']
        if not ins or not outs:
            continue

        entry_volume = sum(fnum(r.get('volume')) for r in ins)
        exit_volume = sum(fnum(r.get('volume')) for r in outs)
        if entry_volume <= 0 or exit_volume <= 0:
            continue

        open_dt = parse_time(ins[0]['time'])
        close_dt = parse_time(outs[-1]['time'])
        # Profit bersih = profit kotor + commission + swap + fee.
        gross_profit = sum(fnum(r.get('profit')) for r in deals)
        commission = sum(fnum(r.get('commission')) for r in deals)
        swap = sum(fnum(r.get('swap')) for r in deals)
        fee = sum(fnum(r.get('fee')) for r in deals)
        net_profit = gross_profit + commission + swap + fee

        positions.append({
            'position_id': position_id,
            'account_login': ins[0].get('account_login'),
            'symbol': ins[0].get('symbol'),
            'side': ins[0].get('type'),
            'open_time': open_dt.strftime('%Y-%m-%d %H:%M:%S'),
            'close_time': close_dt.strftime('%Y-%m-%d %H:%M:%S'),
            'month_key': open_dt.strftime('%Y-%m'),
            'day_key': open_dt.strftime('%Y-%m-%d'),
            'lot': round(entry_volume, 2),
            'entry_avg': round(sum(fnum(r.get('volume')) * fnum(r.get('price')) for r in ins) / entry_volume, 5),
            'exit_avg': round(sum(fnum(r.get('volume')) * fnum(r.get('price')) for r in outs) / exit_volume, 5),
            'gross_profit': round(gross_profit, 2),
            'commission': round(commission, 2),
            'swap': round(swap, 2),
            'fee': round(fee, 2),
            'net_profit': round(net_profit, 2),
            'deal_count': len(deals),
        })

    positions.sort(key=lambda r: r['open_time'])
    cumulative = 0.0
    for index, position in enumerate(positions, start=1):
        cumulative += position['net_profit']
        position['sequence'] = index
        position['cumulative_net'] = round(cumulative, 2)
    return positions


def summarize(positions, balance_events=None):
    """Hitung statistik utama dari posisi tertutup dan cashflow.

    Output fungsi ini dipakai langsung oleh dashboard: win rate, net profit,
    median lot, max lot, per-symbol, per-day, top win/loss, dan discipline flags.
    """
    balance_events = balance_events or []
    # Kalau akun belum punya trade/cashflow, tetap return struktur lengkap agar UI aman.
    if not positions and not balance_events:
        return {
            'account_login': None,
            'total_closed_positions': 0,
            'net_profit': 0.0,
            'win_rate': 0.0,
            'symbols': [],
            'by_symbol': {},
            'by_day': {},
            'discipline_flags': [],
            'recent_positions': [],
            'recent_balance_events': [],
            'month_keys': [],
            'balance_adjustments_total': 0.0,
            'deposit_total': 0.0,
            'withdrawal_total': 0.0,
            'estimated_balance': 0.0,
        }

    account_login = None
    if positions:
        account_login = positions[0]['account_login']
    elif balance_events:
        account_login = balance_events[0]['account_login']
    total = len(positions)
    wins = sum(1 for p in positions if p['net_profit'] > 0)
    losses = sum(1 for p in positions if p['net_profit'] < 0)
    net_profit = round(sum(p['net_profit'] for p in positions), 2)
     
    balance_adjustments_total = round(sum(event['amount'] for event in balance_events), 2)
    deposit_total = round(sum(event['amount'] for event in balance_events if event['amount'] > 0), 2)
    withdrawal_total = round(sum(abs(event['amount']) for event in balance_events if event['amount'] < 0), 2)
    estimated_balance = round(balance_adjustments_total + net_profit, 2)
    total_commission = round(sum(p['commission'] for p in positions), 2)
    total_swap = round(sum(p['swap'] for p in positions), 2)
    lots = sorted(p['lot'] for p in positions)
    median_lot = round(median(lots), 2) if lots else 0.0
    max_lot = max(lots) if lots else 0.0

    # Bucket agregasi untuk statistik per symbol dan per hari.
    by_symbol = defaultdict(lambda: {'count': 0, 'net_profit': 0.0, 'wins': 0, 'max_lot': 0.0})
    by_day = defaultdict(lambda: {'count': 0, 'net_profit': 0.0, 'wins': 0, 'max_lot': 0.0})

    max_loss_streak = 0
    current_loss_streak = 0
    for p in positions:
        if p['net_profit'] < 0:
            current_loss_streak += 1
            max_loss_streak = max(max_loss_streak, current_loss_streak)
        else:
            current_loss_streak = 0

        sym = by_symbol[p['symbol']]
        sym['count'] += 1
        sym['net_profit'] += p['net_profit']
        sym['wins'] += 1 if p['net_profit'] > 0 else 0
        sym['max_lot'] = max(sym['max_lot'], p['lot'])

        day = by_day[p['day_key']]
        day['count'] += 1
        day['net_profit'] += p['net_profit']
        day['wins'] += 1 if p['net_profit'] > 0 else 0
        day['max_lot'] = max(day['max_lot'], p['lot'])

    by_symbol_out = {}
    for key, value in sorted(by_symbol.items()):
        by_symbol_out[key] = {
            'count': value['count'],
            'net_profit': round(value['net_profit'], 2),
            'win_rate': round((value['wins'] / value['count']) * 100, 1) if value['count'] else 0.0,
            'max_lot': round(value['max_lot'], 2),
        }

    by_day_out = {}
    for key, value in sorted(by_day.items()):
        by_day_out[key] = {
            'count': value['count'],
            'net_profit': round(value['net_profit'], 2),
            'win_rate': round((value['wins'] / value['count']) * 100, 1) if value['count'] else 0.0,
            'max_lot': round(value['max_lot'], 2),
        }

    hourly_counts = Counter(p['open_time'][:13] for p in positions)
    busiest_hours = [{'hour': hour, 'count': count} for hour, count in hourly_counts.most_common(5)]

    # Flag otomatis untuk membaca masalah disiplin: overtrade, overlot, loss streak.
    discipline_flags = []
    if total >= 20:
        discipline_flags.append(f'Overtrade risk: {total} closed positions in imported sample.')
    if max_lot >= max(0.10, round(median_lot * 4, 2)):
        discipline_flags.append(f'Overlot spike detected: max lot {max_lot:.2f} vs median lot {median_lot:.2f}.')
    if by_day_out:
        worst_day_key, worst_day = min(by_day_out.items(), key=lambda kv: kv[1]['net_profit'])
        if worst_day['count'] >= 10 and worst_day['net_profit'] < 0:
            discipline_flags.append(
                f'Heavy negative session on {worst_day_key}: {worst_day["count"]} positions, net {worst_day["net_profit"]:.2f}.'
            )
    if max_loss_streak >= 5:
        discipline_flags.append(f'Losing streak reached {max_loss_streak} consecutive closed positions.')

    top_wins = [
        {
            'open_time': p['open_time'],
            'symbol': p['symbol'],
            'side': p['side'],
            'lot': p['lot'],
            'net_profit': p['net_profit'],
        }
        for p in sorted(positions, key=lambda x: x['net_profit'], reverse=True)[:5]
    ]
    top_losses = [
        {
            'open_time': p['open_time'],
            'symbol': p['symbol'],
            'side': p['side'],
            'lot': p['lot'],
            'net_profit': p['net_profit'],
        }
        for p in sorted(positions, key=lambda x: x['net_profit'])[:5]
    ]

    return {
        'account_login': account_login,
        'total_closed_positions': total,
        'winning_positions': wins,
        'losing_positions': losses,
        'win_rate': round((wins / total) * 100, 1) if total else 0.0,
        'net_profit': net_profit,
        'total_commission': total_commission,
        'total_swap': total_swap,
        'balance_adjustments_total': balance_adjustments_total,
        'deposit_total': deposit_total,
        'withdrawal_total': withdrawal_total,
        'estimated_balance': estimated_balance,
        'symbols': sorted({p['symbol'] for p in positions}),
        'median_lot': median_lot,
        'max_lot': round(max_lot, 2),
        'by_symbol': by_symbol_out,
        'by_day': by_day_out,
        'busiest_hours': busiest_hours,
        'max_loss_streak': max_loss_streak,
        'discipline_flags': discipline_flags,
        'top_wins': top_wins,
        'top_losses': top_losses,
        'recent_positions': positions[-15:],
        'recent_balance_events': balance_events[-10:],
        'month_keys': sorted({*(p['month_key'] for p in positions), *(event['month_key'] for event in balance_events)}),
    }


def build_months(positions, balance_events):
    """Kelompokkan posisi dan cashflow ke bucket bulanan YYYY-MM."""
    grouped_positions = defaultdict(list)
    for position in positions:
        grouped_positions[position['month_key']].append(position)

    grouped_events = defaultdict(list)
    for event in balance_events:
        grouped_events[event['month_key']].append(event)

    months = {}
    for month_key in sorted(set(grouped_positions) | set(grouped_events)):
        month_positions = grouped_positions.get(month_key, [])
        month_events = grouped_events.get(month_key, [])
        months[month_key] = {
            'summary': summarize(month_positions, month_events),
            'positions': month_positions,
            'balance_events': month_events,
        }
    return months


def convert(csv_path: Path):
    """Pipeline utama importer: CSV -> rows -> events/positions -> JSON struktur final."""
    rows = read_mt5_rows(csv_path)
    balance_events = build_balance_events(rows)
    positions = build_closed_positions(rows)
    return {
        'source_csv': str(csv_path),
        'source_mtime': datetime.fromtimestamp(csv_path.stat().st_mtime).isoformat(),
        'summary': summarize(positions, balance_events),
        'months': build_months(positions, balance_events),
        'positions': positions,
        'balance_events': balance_events,
    }


def main():
    """CLI entry point.

    Cara pakai:
    python3 import_mt5_history.py input.csv output.json
    Kalau output.json tidak diberikan, hasil JSON hanya diprint ke stdout.
    """
    if len(sys.argv) < 2:
        print('usage: import_mt5_history.py <csv-path> [output-json-path]', file=sys.stderr)
        sys.exit(1)

    csv_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2]) if len(sys.argv) >= 3 else None

    out = convert(csv_path)
    rendered = json.dumps(out, indent=2)
    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(rendered + '\n', encoding='utf-8')
    print(rendered)


if __name__ == '__main__':
    main()
