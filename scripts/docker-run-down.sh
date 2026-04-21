#!/usr/bin/env bash
set -euo pipefail

docker rm -f siabdi-web >/dev/null 2>&1 || true

echo "Stopped SIABDI web container. Dependency volumes are preserved."
