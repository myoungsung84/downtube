#!/usr/bin/env bash
set -euo pipefail

DIST_DIR="./dist"

bash "scripts/build-tools/build-clean.sh"

pnpm install --frozen-lockfile

# build (typecheck + electron-vite)
bash "scripts/build-tools/build.sh"

# package arm64
pnpm exec electron-builder --mac --arm64
APP_DIR_ARM64="$(find "${DIST_DIR}/mac-arm64" -maxdepth 1 -type d -name '*.app' | head -n 1)"

if [ -z "$APP_DIR_ARM64" ] || [ ! -d "$APP_DIR_ARM64" ]; then
  echo "Error: arm64 app bundle not found under ${DIST_DIR}/mac-arm64"
  exit 1
fi

# adhoc codesign (for local run / pre-notarize)
codesign --deep --force --sign - "$APP_DIR_ARM64"
