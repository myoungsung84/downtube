#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RELEASE_DIR="$ROOT_DIR/releases"
WIN_UNPACKED_DIR="$ROOT_DIR/dist/win-unpacked"
NODE_BIN="${NODE_BIN:-$(command -v node.exe >/dev/null 2>&1 && echo node.exe || echo node)}"

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

cd "$ROOT_DIR"

APP_NAME="$("$NODE_BIN" -p "require('./package.json').name")"
APP_VERSION="$("$NODE_BIN" -p "require('./package.json').version")"
TAG_NAME="v${APP_VERSION}-win"

ZIP_NAME="${APP_NAME}-${TAG_NAME}-unpacked.zip"
ZIP_PATH="${RELEASE_DIR}/${ZIP_NAME}"
ZIP_PATH_PWSH="releases\\${ZIP_NAME}"
WIN_UNPACKED_DIR_PWSH="dist\\win-unpacked"

command -v powershell.exe >/dev/null 2>&1 || { echo "Error: powershell.exe not found." >&2; exit 1; }

bash "scripts/build-tools/build-clean.sh"
mkdir -p "$RELEASE_DIR"

run_pnpm install --frozen-lockfile

bash scripts/build-tools/build.sh

bash scripts/build-tools/build-helper.sh

HELPER_EXE="$ROOT_DIR/out/update-helper/update-helper.exe"
if [ ! -f "$HELPER_EXE" ]; then
  echo "Error: helper exe not found after build: $HELPER_EXE" >&2
  exit 1
fi
echo "[build-win] helper exe verified: $HELPER_EXE" >&2

run_pnpm exec electron-builder --win --dir >&2

HELPER_IN_DIST="$WIN_UNPACKED_DIR/resources/update-helper/update-helper.exe"
if [ ! -f "$HELPER_IN_DIST" ]; then
  echo "Error: helper exe missing from dist: $HELPER_IN_DIST" >&2
  exit 1
fi
echo "[build-win] helper exe in dist verified: $HELPER_IN_DIST" >&2

if [ ! -d "$WIN_UNPACKED_DIR" ]; then
  echo "Error: unpacked dir not found: $WIN_UNPACKED_DIR" >&2
  exit 1
fi

rm -f "$ZIP_PATH"
powershell.exe -NoProfile -Command \
  "Compress-Archive -Path '${WIN_UNPACKED_DIR_PWSH}\\*' -DestinationPath '${ZIP_PATH_PWSH}' -Force" >&2

if [ ! -f "$ZIP_PATH" ]; then
  echo "Error: zip not created: $ZIP_PATH" >&2
  exit 1
fi

printf '%s\n' "$ZIP_PATH"

powershell.exe -NoProfile -Command \
  "Invoke-Item -LiteralPath 'dist\\win-unpacked'" >/dev/null 2>&1 || true
