# Full Docker MT5 Stack

This stack runs three containers:

```text
journal-api   : dashboard + CSV ingestion API
mt5-runner    : Wine + Xvfb + MT5 terminal or mock exporter
export-sync   : watches exported CSV and posts it to journal-api
```

## Safe test mode

Default is mock mode so the pipeline can be stress-tested without real MT5:

```bash
docker compose -f docker-compose.mt5.yml up -d --build
curl http://127.0.0.1:8088/healthz
./scripts/stability_test.sh
```

## Real MT5 mode

You need MT5 terminal files available in the `mt5-terminal` Docker volume or mounted into `/mt5`.

Set in `.env`:

```env
MT5_RUN_MODE=terminal
MT5_TERMINAL_EXE=/mt5/terminal64.exe
MT5_308881_LOGIN=308881
MT5_308881_PASSWORD=<secret>
MT5_308881_SERVER=Nozax-Trade
```

Then copy terminal files into the volume, example from host path:

```bash
docker compose -f docker-compose.mt5.yml up -d --build journal-api
CID=$(docker create -v mt5-vps-journal_mt5-terminal:/mt5 debian:bookworm-slim true)
docker cp /home/ardani/.mt5-wine/drive_c/MetaTrader5ExporterFresh/. "$CID:/mt5/"
docker rm "$CID"
docker compose -f docker-compose.mt5.yml up -d --build
```

Important: real login/export still depends on the MT5 terminal/EA/exporter being configured. Docker can run the terminal; it cannot magically create the EA export logic if it is missing.

## Security

- `mt5-runner` exposes no ports.
- `export-sync` talks to `journal-api` only inside Docker network.
- `journal-api` binds to host `127.0.0.1:8088` only.
- Put HTTPS/auth in host Nginx/Caddy.
- Keep `.env` permission `600` and never commit it.

## Crash testing

`./scripts/stability_test.sh` checks API repeatedly and deliberately kills:

- `export-sync` once
- `mt5-runner` once

Docker restart policy should bring them back.
