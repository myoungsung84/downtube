#!/usr/bin/env bash
set -euo pipefail

RELEASE_DIR="./releases"
WIN_UNPACKED_DIR="./dist/win-unpacked"

APP_NAME="$(node -p "require('./package.json').name")"
APP_VERSION="$(node -p "require('./package.json').version")"
TAG_NAME="v${APP_VERSION}-win"

ZIP_NAME="${APP_NAME}-${TAG_NAME}-unpacked.zip"
ZIP_PATH="${RELEASE_DIR}/${ZIP_NAME}"

command -v powershell.exe >/dev/null 2>&1 || { echo "Error: powershell.exe not found." >&2; exit 1; }
command -v cygpath >/dev/null 2>&1 || { echo "Error: cygpath not found." >&2; exit 1; }

bash "scripts/build-tools/build-clean.sh"
mkdir -p "$RELEASE_DIR"

pnpm install --frozen-lockfile

bash scripts/build-tools/build.sh

electron-builder --win --dir >&2

if [ ! -d "$WIN_UNPACKED_DIR" ]; then
  echo "Error: unpacked dir not found: $WIN_UNPACKED_DIR" >&2
  exit 1
fi

rm -f "$ZIP_PATH"
powershell.exe -NoProfile -Command \
  "Compress-Archive -Path '${WIN_UNPACKED_DIR}\*' -DestinationPath '${ZIP_PATH}' -Force" >&2

if [ ! -f "$ZIP_PATH" ]; then
  echo "Error: zip not created: $ZIP_PATH" >&2
  exit 1
fi

printf '%s\n' "$ZIP_PATH"

WIN_UNPACKED_DIR_WIN="$(cygpath -aw "$WIN_UNPACKED_DIR")"
powershell.exe -NoProfile -Command \
  "Invoke-Item -LiteralPath '$WIN_UNPACKED_DIR_WIN'" >/dev/null 2>&1 || true