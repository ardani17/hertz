# MT5 VPS Journal Lab

Headless Ubuntu VPS-style lab for Arr's MT5 trading journal dashboard.

This project is designed to run without GUI:

- `server.py` serves the dashboard and provides token-protected ingestion API.
- `vps_journal/importer.py` converts MT5 CSV exports into dashboard history JSON.
- `vps_journal/dashboard.py` renders the existing dashboard HTML from history JSON.
- `scripts/mock_mt5_exporter.py` simulates MT5 CSV export for laptop/headless testing.
- `deploy/` contains production templates for systemd and Nginx.

## Local test

```bash
cd mt5-vps-journal
cp .env.example .env
python3 vps_journal/dashboard.py
python3 server.py
# open http://127.0.0.1:8088/
```

## API ingestion

```bash
curl -X POST \
  -H "X-API-Token: change-me-long-random-token" \
  --data-binary @data/trade_history_400241.csv \
  http://127.0.0.1:8088/api/import/400241/csv
```

## Production concept

```text
MT5 under Wine/Xvfb or another exporter
  -> CSV/JSON push to token-protected API
  -> importer builds <login>-history.json
  -> dashboard rebuilds public/dashboard.html
  -> Nginx + HTTPS + auth expose dashboard
```

Do not store MT5 passwords in `accounts.json`; use `.env` / systemd EnvironmentFile.
