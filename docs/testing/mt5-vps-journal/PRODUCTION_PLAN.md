# Production Plan — Ubuntu VPS MT5 Journal

## Target architecture

```text
Nginx HTTPS/Auth
  -> mt5-journal.service : Python API/dashboard on 127.0.0.1:8088
      -> data/*.csv
      -> data/*-history.json
      -> public/dashboard.html

Optional on same VPS:
mt5-headless.service : Wine + Xvfb + MT5 terminal
  -> EA/MQL5 exporter writes CSV to MQL5/Files
  -> mt5-export-sync.timer posts CSV to local API
```

## Safer phase order

1. Deploy dashboard/API only.
2. Protect with HTTPS + password + firewall.
3. Push CSV from laptop/exporter to VPS API.
4. Only after stable: move MT5 to Wine/Xvfb on VPS.

## Ubuntu packages needed later

Do not run blindly. Review first.

```bash
sudo apt update
sudo apt install -y python3 python3-venv nginx ufw certbot python3-certbot-nginx curl
# Only if running MT5 directly on Ubuntu VPS:
sudo apt install -y wine xvfb winetricks cabextract
```

## Deployment sketch

```bash
sudo useradd --system --create-home --home-dir /opt/mt5-vps-journal --shell /usr/sbin/nologin mt5journal
sudo rsync -a ./mt5-vps-journal/ /opt/mt5-vps-journal/
sudo chown -R mt5journal:mt5journal /opt/mt5-vps-journal
sudo install -m 600 .env.example /etc/mt5-journal.env
sudo nano /etc/mt5-journal.env
sudo cp deploy/systemd/mt5-journal.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now mt5-journal.service
sudo cp deploy/nginx/mt5-journal.conf /etc/nginx/sites-available/mt5-journal.conf
sudo ln -s /etc/nginx/sites-available/mt5-journal.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Security checklist

- Replace `INGEST_TOKEN` with `openssl rand -hex 32`.
- Set `DASHBOARD_USER` and `DASHBOARD_PASSWORD`.
- Bind API app to `127.0.0.1`; only Nginx exposed.
- Use HTTPS before real credentials/data.
- UFW allow only SSH + HTTP/HTTPS.
- Back up `data/`, `.env`, and MT5 exporter config.
- Never commit `.env` or MT5 passwords.

## Headless MT5 notes

Ubuntu + Wine + Xvfb can work, but treat it as fragile:

- Watchdog/Restart=always is required.
- Monitor last CSV update time.
- Keep broker credentials in `/etc/mt5-journal.env`, not repo.
- Prefer EA/MQL5 exporter writing CSV or posting HTTP rather than UI automation.
