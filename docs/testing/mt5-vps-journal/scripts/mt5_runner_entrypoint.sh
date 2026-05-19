#!/usr/bin/env bash
set -euo pipefail

: "${DISPLAY:=:99}"
: "${WINEPREFIX:=/wine-prefix}"
: "${MT5_TERMINAL_EXE:=/mt5/terminal64.exe}"
: "${EXPORT_DIR:=/exports}"
: "${MT5_RUN_MODE:=terminal}"
: "${MT5_LOGIN:=}"
: "${MT5_PASSWORD:=}"
: "${MT5_SERVER:=}"

mkdir -p "$WINEPREFIX" "$EXPORT_DIR" /logs

log() {
  printf '[%s] %s\n' "$(date -Is)" "$*" | tee -a /logs/mt5-runner.log
}

start_xvfb() {
  if ! pgrep -f "Xvfb ${DISPLAY}" >/dev/null 2>&1; then
    log "starting Xvfb on ${DISPLAY}"
    Xvfb "$DISPLAY" -screen 0 1280x720x24 -nolisten tcp >>/logs/xvfb.log 2>&1 &
    sleep 1
  fi
}

mock_loop() {
  local login="${MT5_LOGIN:-308881}"
  local out="${EXPORT_DIR}/trade_history_${login}.csv"
  local tmp="${out}.tmp"
  local interval="${MOCK_INTERVAL_SECONDS:-10}"
  local iteration=0
  local count idx open_time close_time lot profit pos rows

  log "MT5_RUN_MODE=mock; generating synthetic CSV exports for login ${login}"

  while true; do
    iteration=$((iteration + 1))
    count=$((5 + iteration))
    if (( count > 30 )); then count=30; fi

    {
      printf 'time,position_id,symbol,type,entry,volume,price,profit,commission,swap,fee,comment,account_login\n'
      printf '%s,,,%s,,,%s,%s,%s,%s,%s,%s,%s\n' \
        "$(date -u '+%Y.%m.%d %H:%M:%S')" \
        "BALANCE" "" "1500.00" "0" "0" "0" "Docker mock funding" "$login"

      idx=1
      while (( idx <= count )); do
        open_time="$(date -u -d "-${idx} minutes" '+%Y.%m.%d %H:%M:%S')"
        close_time="$(date -u -d "-$((idx - 1)) minutes" '+%Y.%m.%d %H:%M:%S')"
        case $((idx % 4)) in
          0) lot="0.01" ;;
          1) lot="0.02" ;;
          2) lot="0.03" ;;
          *) lot="0.05" ;;
        esac
        profit_int=$(( ((iteration * 17 + idx * 13) % 900) - 300 ))
        profit="$(printf '%s.%02d' "$((profit_int / 100))" "$((profit_int < 0 ? -profit_int % 100 : profit_int % 100))")"
        pos="${login}${iteration}$(printf '%04d' "$idx")"
        printf '%s,%s,XAUUSD#,BUY,IN,%s,2300.00,0,-0.03,0,0,mock open,%s\n' "$open_time" "$pos" "$lot" "$login"
        printf '%s,%s,XAUUSD#,BUY,OUT,%s,2301.00,%s,-0.03,0,0,mock close,%s\n' "$close_time" "$pos" "$lot" "$profit" "$login"
        idx=$((idx + 1))
      done
    } >"$tmp"

    mv "$tmp" "$out"
    rows=$((1 + count * 2))
    log "wrote ${out} rows=${rows}"
    sleep "$interval"
  done
}

start_xvfb
export DISPLAY WINEPREFIX WINEDEBUG="${WINEDEBUG:--all}"

if [[ "$MT5_RUN_MODE" == "mock" ]]; then
  mock_loop
fi

if [[ ! -f "$MT5_TERMINAL_EXE" ]]; then
  log "MT5 terminal not found: $MT5_TERMINAL_EXE"
  log "Mount terminal folder into /mt5 or set MT5_RUN_MODE=mock for pipeline test."
  exit 2
fi

log "initializing Wine prefix at $WINEPREFIX"
wineboot -u >>/logs/wineboot.log 2>&1 || true

log "starting MT5 terminal: $MT5_TERMINAL_EXE"
log "login/server are provided via env if terminal/exporter script consumes them; not printed for safety."
exec wine "$MT5_TERMINAL_EXE" /portable
