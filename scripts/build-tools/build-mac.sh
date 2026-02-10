#!/usr/bin/env bash
set -euo pipefail

DIST_DIR="./dist"
OUT_DIR="./out"
BIN_DIR="./bin"

APP_NAME="$(node -p "require('./package.json').name")"
APP_DIR_ARM64="${DIST_DIR}/mac-arm64/${APP_NAME}.app"
APP_DIR_X64="${DIST_DIR}/mac/${APP_NAME}.app"

rm -rf "$DIST_DIR" "$OUT_DIR"

npm ci

FFMPEG_SRC="$(node -p "require('ffmpeg-static')")"
FFMPEG_FILENAME="$(basename "$FFMPEG_SRC")"

mkdir -p "$BIN_DIR"
cp "$FFMPEG_SRC" "$BIN_DIR/$FFMPEG_FILENAME"

# build (typecheck + electron-vite)
bash "scripts/build-tools/build.sh"

# package arm64
electron-builder --mac --arm64

if [ ! -d "$APP_DIR_ARM64" ]; then
  echo "Error: app bundle not found: $APP_DIR_ARM64"
  exit 1
fi

# adhoc codesign (for local run / pre-notarize)
codesign --deep --force --sign - "$APP_DIR_ARM64"

# package x64
electron-builder --mac --x64

if [ ! -d "$APP_DIR_X64" ]; then
  echo "Error: app bundle not found: $APP_DIR_X64"
  exit 1
fi

codesign --deep --force --sign - "$APP_DIR_X64"
