#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

bash "${ROOT_DIR}/scripts/build-tools/ensure-tools.sh"

# 1) TypeScript typecheck (node + web)
pnpm typecheck

# 2) Electron + Vite build
electron-vite build
