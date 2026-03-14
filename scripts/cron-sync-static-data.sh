#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/var/www/baocaoluadao.com"
ENV_FILE="${ROOT_DIR}/.env.production"
LOG_DIR="/var/log/baocaoluadao"
PORT_FALLBACK="3000"

cd "$ROOT_DIR"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

if [[ -z "${INTERNAL_SYNC_TOKEN:-}" ]]; then
  echo "[cron] INTERNAL_SYNC_TOKEN is missing; abort"
  exit 1
fi

PORT="${PORT:-$PORT_FALLBACK}"

sync_endpoint() {
  local name="$1"
  local url="$2"

  if ! command -v curl >/dev/null 2>&1; then
    echo "[cron] curl is not installed; abort"
    exit 1
  fi

  echo "[cron] ${name} -> POST ${url}"
  curl -fsS -m 20 \
    -X POST \
    -H "Authorization: Bearer ${INTERNAL_SYNC_TOKEN}" \
    -H "Accept: application/json" \
    "$url" >/dev/null
}

mkdir -p "$LOG_DIR"

sync_endpoint "tinnhiem-sync" "http://127.0.0.1:${PORT}/api/internal/sync-tinnhiem"
sync_endpoint "policy-violations-sync" "http://127.0.0.1:${PORT}/api/internal/sync-policy-violations"
sync_endpoint "domain-registration-sync" "http://127.0.0.1:${PORT}/api/internal/sync-domain-registration"
sync_endpoint "domain-expiry-sync" "http://127.0.0.1:${PORT}/api/internal/sync-domain-expiry"

echo "[cron] done"
