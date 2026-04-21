#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_IMAGE="${NODE_IMAGE:-node:25-alpine}"
WEB_CONTAINER="siabdi-web"
PNPM_VOLUME="siabdi_web_pnpm_store"
NODE_MODULES_VOLUME="siabdi_web_node_modules"

if [[ ! -f "${APP_ROOT}/.env" ]]; then
  echo "Missing .env. Create it first:"
  echo "  cp .env.example .env"
  exit 1
fi

docker volume inspect "${PNPM_VOLUME}" >/dev/null 2>&1 || docker volume create "${PNPM_VOLUME}" >/dev/null
docker volume inspect "${NODE_MODULES_VOLUME}" >/dev/null 2>&1 || docker volume create "${NODE_MODULES_VOLUME}" >/dev/null
docker rm -f "${WEB_CONTAINER}" >/dev/null 2>&1 || true

docker run -d \
  --name "${WEB_CONTAINER}" \
  --restart unless-stopped \
  --workdir /app \
  --env-file "${APP_ROOT}/.env" \
  -e NEXT_TELEMETRY_DISABLED=1 \
  -p 3001:3001 \
  -v "${APP_ROOT}:/app" \
  -v "${PNPM_VOLUME}:/pnpm/store" \
  -v "${NODE_MODULES_VOLUME}:/app/node_modules" \
  "${NODE_IMAGE}" \
  sh -c "npm install -g pnpm@10.11.0 && pnpm config set store-dir /pnpm/store && pnpm install --frozen-lockfile=false && pnpm exec next dev --hostname 0.0.0.0 --port 3001" >/dev/null

echo "Frontend is running."
echo "Web: http://localhost:3001"
