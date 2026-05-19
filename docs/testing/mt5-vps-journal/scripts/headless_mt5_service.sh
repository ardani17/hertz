#!/usr/bin/env bash
set -euo pipefail

# Headless MT5 starter for Ubuntu VPS.
# This script assumes packages are installed separately:
#   xvfb wine winetricks cabextract
# and MT5 terminal files exist at $MT5_TERMINAL_EXE.

: "${DISPLAY:=:99}"
: "${WINEPREFIX:=/opt/mt5-journal/wine-prefix}"
: "${MT5_TERMINAL_EXE:=$WINEPREFIX/drive_c/Program Files/MetaTrader 5/terminal64.exe}"

mkdir -p "$(dirname "$WINEPREFIX")"

if ! pgrep -f "Xvfb ${DISPLAY}" >/dev/null 2>&1; then
  Xvfb "${DISPLAY}" -screen 0 1280x720x24 -nolisten tcp &
fi

export DISPLAY WINEPREFIX

if [[ ! -f "$MT5_TERMINAL_EXE" ]]; then
  echo "MT5 terminal not found: $MT5_TERMINAL_EXE" >&2
  echo "Install/copy MT5 first, then update MT5_TERMINAL_EXE in /etc/mt5-journal.env" >&2
  exit 2
fi

exec wine "$MT5_TERMINAL_EXE" /portable
