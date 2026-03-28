#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HELPER_SRC="$ROOT_DIR/src/update-helper/index.ts"
HELPER_OUT_DIR="$ROOT_DIR/out/update-helper"
HELPER_BUNDLE="$HELPER_OUT_DIR/index.cjs"
HELPER_EXE="$HELPER_OUT_DIR/update-helper.exe"

mkdir -p "$HELPER_OUT_DIR"

echo "[build-helper] bundling update-helper..." >&2
pnpm exec esbuild "$HELPER_SRC" \
  --bundle \
  --platform=node \
  --target=node18 \
  --format=cjs \
  --outfile="$HELPER_BUNDLE"

echo "[build-helper] packaging update-helper.exe..." >&2
pnpm exec pkg "$HELPER_BUNDLE" \
  --targets node18-win-x64 \
  --output "$HELPER_EXE" \
  --no-bytecode \
  --public

if [ ! -f "$HELPER_EXE" ]; then
  echo "[build-helper] Error: update-helper.exe not created at $HELPER_EXE" >&2
  exit 1
fi

echo "[build-helper] done: $HELPER_EXE" >&2
