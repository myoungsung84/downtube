#!/usr/bin/env bash
set -euo pipefail

DIST_DIR="./dist"
OUT_DIR="./out"
BIN_DIR="./bin"
RELEASE_DIR="./releases"
WIN_UNPACKED_DIR="${DIST_DIR}/win-unpacked"

APP_NAME="$(node -p "require('./package.json').name")"
APP_VERSION="$(node -p "require('./package.json').version")"
TAG_NAME="v${APP_VERSION}-win"

ZIP_NAME="${APP_NAME}-${TAG_NAME}-unpacked.zip"
ZIP_PATH="${RELEASE_DIR}/${ZIP_NAME}"

command -v powershell.exe >/dev/null 2>&1 || { echo "Error: powershell.exe not found." >&2; exit 1; }

rm -rf "$DIST_DIR" "$OUT_DIR"
mkdir -p "$BIN_DIR" "$RELEASE_DIR"

npm ci

FFMPEG_SRC="$(node -p "require('ffmpeg-static')")"
FFMPEG_FILENAME="$(basename "$FFMPEG_SRC")"

cp "$FFMPEG_SRC" "$BIN_DIR/$FFMPEG_FILENAME"

bash scripts/build.sh

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
