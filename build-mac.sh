#!/bin/bash

# 앱 이름 및 경로
APP_NAME="downtube"
APP_DIR_x64="dist/mac/$APP_NAME.app"
APP_DIR_arm64="dist/mac-arm64/$APP_NAME.app"
ARCHIVE_NAME="$APP_NAME-mac.tar.gz"
DIST_DIR="dist"
OUT_DIR="out"

rm -rf $DIST_DIR
rm -rf $OUT_DIR

echo "📦 Step 1: 앱 빌드 시작 -> mac arm64"
npm run build:mac:arm64

echo "🔐 Step 2: codesign 서명 중..."
codesign --deep --force --sign - "$APP_DIR_arm64"

echo "📦 Step 1: 앱 빌드 시작 -> mac x64"
npm run build:mac:x64
echo "🔐 Step 2: codesign 서명 중..."
codesign --deep --force --sign - "$APP_DIR_x64"
