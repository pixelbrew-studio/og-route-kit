#!/usr/bin/env bash
set -euo pipefail

PORT="${CONDUCTOR_PORT:-3000}"
BASE_URL="http://127.0.0.1:${PORT}"
OG_URL="${BASE_URL}/api/og?title=Hello&description=World"
OUT_FILE=".context/og-image-test.png"
LOG_FILE=".context/conductor-next.log"
SERVER_PID=""

cleanup() {
  if [[ -n "${SERVER_PID}" ]] && kill -0 "${SERVER_PID}" 2>/dev/null; then
    kill "${SERVER_PID}" 2>/dev/null || true
    wait "${SERVER_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT

mkdir -p .context

echo "==> Installing dependencies"
pnpm install --frozen-lockfile

echo "==> Typechecking package"
pnpm typecheck

echo "==> Running tests"
pnpm test

echo "==> Building package"
pnpm build

echo "==> Building Next example"
pnpm --filter og-route-kit-next-app-example build

if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:"${PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port ${PORT} is already in use. Set CONDUCTOR_PORT to a free port and retry." >&2
  exit 1
fi

echo "==> Starting Next example on ${BASE_URL}"
: > "${LOG_FILE}"
pnpm --filter og-route-kit-next-app-example exec next dev -p "${PORT}" >"${LOG_FILE}" 2>&1 &
SERVER_PID="$!"

echo "==> Waiting for OG route"
for attempt in {1..60}; do
  if curl -fsS -o /dev/null "${OG_URL}" >/dev/null 2>&1; then
    break
  fi

  if ! kill -0 "${SERVER_PID}" 2>/dev/null; then
    echo "Next dev server exited early. Log follows:" >&2
    sed -n '1,220p' "${LOG_FILE}" >&2
    exit 1
  fi

  if [[ "${attempt}" == "60" ]]; then
    echo "Timed out waiting for ${OG_URL}. Log follows:" >&2
    sed -n '1,220p' "${LOG_FILE}" >&2
    exit 1
  fi

  sleep 1
done

echo "==> Checking PNG response"
node dist/cli/index.js check --url "${OG_URL}" --max-bytes 8000000

echo "==> Exporting test PNG"
node dist/cli/index.js export --url "${OG_URL}" --out "${OUT_FILE}"
file "${OUT_FILE}"

echo "==> Checking package tarball"
pnpm pack --dry-run

echo "==> Conductor verification passed"
echo "Route: ${OG_URL}"
echo "PNG: ${OUT_FILE}"
echo "Server log: ${LOG_FILE}"
