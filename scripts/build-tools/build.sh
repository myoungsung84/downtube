#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

run_pnpm() {
  if command -v powershell.exe >/dev/null 2>&1; then
    local escaped_args=()
    local arg
    local joined_args

    for arg in "$@"; do
      escaped_args+=("'${arg//\'/\'\'}'")
    done

    joined_args="${escaped_args[*]}"
    powershell.exe -NoProfile -Command "pnpm ${joined_args}"
    return
  fi

  if command -v pnpm >/dev/null 2>&1; then
    pnpm "$@"
    return
  fi

  echo "Error: pnpm not found." >&2
  exit 1
}

bash "${ROOT_DIR}/scripts/build-tools/ensure-tools.sh"

# 1) TypeScript typecheck (node + web)
run_pnpm typecheck

# 2) Electron + Vite build
run_pnpm exec electron-vite build
