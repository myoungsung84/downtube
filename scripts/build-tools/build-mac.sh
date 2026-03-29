#!/usr/bin/env bash
set -euo pipefail

DIST_DIR="./dist"

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

bash "scripts/build-tools/build-clean.sh"

run_pnpm install --frozen-lockfile

# build (typecheck + electron-vite)
bash "scripts/build-tools/build.sh"

# package arm64
run_pnpm exec electron-builder --mac --arm64
APP_DIR_ARM64="$(find "${DIST_DIR}/mac-arm64" -maxdepth 1 -type d -name '*.app' | head -n 1)"

if [ -z "$APP_DIR_ARM64" ] || [ ! -d "$APP_DIR_ARM64" ]; then
  echo "Error: arm64 app bundle not found under ${DIST_DIR}/mac-arm64"
  exit 1
fi

APP_DIR_ARM64_ABS="$(cd "$(dirname "$APP_DIR_ARM64")" && pwd -P)/$(basename "$APP_DIR_ARM64")"

# adhoc codesign (for local run / pre-notarize)
codesign --deep --force --sign - "$APP_DIR_ARM64_ABS"

open -R "$APP_DIR_ARM64_ABS"
