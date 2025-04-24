#!/bin/bash

set -e

DIST_DIR="./dist"
OUT_DIR="./out"
BIN_DIR="./bin"

# 1. 기존 빌드 폴더 삭제
rm -rf "$DIST_DIR"
rm -rf "$OUT_DIR"

npm i

FFMPEG_SRC=$(node -p "require('ffmpeg-static')")
FFMPEG_FILENAME=$(basename "$FFMPEG_SRC")

echo "🛠 Step 1: ffmpeg 복사"
echo "    From: $FFMPEG_SRC"
echo "    To:   $BIN_DIR/$FFMPEG_FILENAME"

mkdir -p "$BIN_DIR"
cp "$FFMPEG_SRC" "$BIN_DIR/$FFMPEG_FILENAME"

echo "📦 Step 2: 앱 빌드 시작 -> win"
npm run build:win

echo "✅ 빌드 완료!"
