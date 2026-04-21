#!/usr/bin/env bash
set -euo pipefail

docker logs -f "${1:-siabdi-web}"
