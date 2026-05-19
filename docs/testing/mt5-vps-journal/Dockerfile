FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_HOST=0.0.0.0 \
    APP_PORT=8088 \
    TRADING_DIR=/app \
    DATA_DIR=/app/data \
    PUBLIC_DIR=/app/public \
    ACCOUNTS_PATH=/app/accounts.json \
    ENV_PATH=/app/.env

WORKDIR /app

RUN addgroup --system app && adduser --system --ingroup app app \
    && mkdir -p /app/data /app/public/data /app/public/assets /app/logs \
    && chown -R app:app /app

COPY --chown=app:app requirements.txt ./
RUN python -m pip install --no-cache-dir --upgrade pip \
    && if [ -s requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

COPY --chown=app:app server.py accounts.json ./
COPY --chown=app:app vps_journal ./vps_journal
COPY --chown=app:app public ./public
COPY --chown=app:app scripts ./scripts

USER app

EXPOSE 8088

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import json,urllib.request; d=json.loads(urllib.request.urlopen('http://127.0.0.1:8088/healthz', timeout=3).read().decode()); raise SystemExit(0 if d.get('ok') else 1)"

CMD ["python", "server.py"]
