# Docker Production — MT5 VPS Journal

## Recommended production shape

```text
Internet
  -> Nginx/Caddy/Traefik HTTPS on VPS host
  -> 127.0.0.1:8088
  -> Docker container: journal-api
      -> /app/data volume
      -> /app/public generated dashboard
```

Keep the Python app bound to localhost on the host:

```yaml
ports:
  - "127.0.0.1:8088:8088"
```

Do **not** expose `8088` directly to the public internet.

## First run

```bash
cd mt5-vps-journal
cp .env.example .env
# edit .env before production
# INGEST_TOKEN=$(openssl rand -hex 32)
# DASHBOARD_USER=arr
# DASHBOARD_PASSWORD=<strong password>

docker compose build
docker compose up -d
curl http://127.0.0.1:8088/healthz
```

Open locally through SSH tunnel or reverse proxy:

```bash
ssh -L 8088:127.0.0.1:8088 user@vps
# then browse http://127.0.0.1:8088/
```

## Production compose

Default `docker-compose.yml` already uses named volumes.

For stricter production hardening with read-only container filesystem:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Volume names:

```text
mt5-vps-journal_journal-data
mt5-vps-journal_journal-logs
```

Backup:

```bash
docker run --rm \
  -v mt5-vps-journal_journal-data:/data:ro \
  -v "$PWD/backups:/backup" \
  alpine tar czf /backup/journal-data-$(date +%F-%H%M).tgz -C /data .
```

## Push MT5 CSV into Docker API

From same VPS host:

```bash
curl -X POST \
  -H "X-API-Token: $INGEST_TOKEN" \
  --data-binary @trade_history_400241.csv \
  http://127.0.0.1:8088/api/import/400241/csv
```

From laptop/exporter to VPS:

```bash
curl -X POST \
  -H "X-API-Token: $INGEST_TOKEN" \
  --data-binary @trade_history_400241.csv \
  https://journal.example.com/api/import/400241/csv
```

If exposing ingestion via public HTTPS, use a strong `INGEST_TOKEN`, HTTPS, rate limiting, and preferably IP allowlist/VPN.

## Nginx reverse proxy example

Use `deploy/nginx/mt5-journal.conf`, update domain, then enable HTTPS:

```bash
sudo cp deploy/nginx/mt5-journal.conf /etc/nginx/sites-available/mt5-journal.conf
sudo ln -s /etc/nginx/sites-available/mt5-journal.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d journal.example.com
```

## MT5/Wine note

This Docker setup is for the dashboard/API. Keep MT5 Wine/Xvfb outside this container first.

Recommended:

```text
MT5 Wine/Xvfb on host or another machine
  -> writes CSV
  -> curl POST to journal-api container
```

Only containerize MT5 later if the host-based exporter is already stable.
