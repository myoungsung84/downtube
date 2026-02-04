#!/usr/bin/env bash
set -euo pipefail

DIST_DIR="./dist"
OUT_DIR="./out"
BIN_DIR="./bin"

rm -rf "$DIST_DIR" "$OUT_DIR"

npm ci

FFMPEG_SRC="$(node -p "require('ffmpeg-static')")"
FFMPEG_FILENAME="$(basename "$FFMPEG_SRC")"

mkdir -p "$BIN_DIR"
cp "$FFMPEG_SRC" "$BIN_DIR/$FFMPEG_FILENAME"

# build (typecheck + electron-vite)
bash "scripts/build.sh"

# package (windows installer)
electron-builder --win
