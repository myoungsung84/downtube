#!/bin/bash

# 앱 이름 및 경로
APP_NAME="downtube"
APP_DIR_x64="dist/mac/$APP_NAME.app"
APP_DIR_arm64="dist/mac-arm64/$APP_NAME.app"
DIST_DIR="dist"
OUT_DIR="out"
BIN_DIR="bin"

rm -rf $DIST_DIR
rm -rf $OUT_DIR

npm i

FFMPEG_SRC=$(node -p "require('ffmpeg-static')")
FFMPEG_FILENAME=$(basename "$FFMPEG_SRC")
echo "🛠 Step 1: ffmpeg 복사"
echo "    From: $FFMPEG_SRC"
echo "    To:   $BIN_DIR/$FFMPEG_FILENAME"

mkdir -p "$BIN_DIR"
cp "$FFMPEG_SRC" "$BIN_DIR/$FFMPEG_FILENAME"

echo "📦 Step 2: 앱 빌드 시작 -> mac arm64"
npm run build:mac:arm64

echo "🔐 Step 2: codesign 서명 중..."
codesign --deep --force --sign - "$APP_DIR_arm64"

echo "📦 Step 3: 앱 빌드 시작 -> mac x64"
npm run build:mac:x64
echo "🔐 Step 3: codesign 서명 중..."
codesign --deep --force --sign - "$APP_DIR_x64"

echo "✅ 빌드 완료!"