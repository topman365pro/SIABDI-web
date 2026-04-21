#!/usr/bin/env bash
set -euo pipefail

"$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/docker-run-down.sh"

for volume in siabdi_web_pnpm_store siabdi_web_node_modules; do
  docker volume rm "${volume}" >/dev/null 2>&1 || true
done

echo "Removed SIABDI web container and dependency volumes."
