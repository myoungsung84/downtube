#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HELPER_SRC="src/update-helper/index.ts"
HELPER_OUT_DIR="out/update-helper"
HELPER_BUNDLE="$HELPER_OUT_DIR/index.cjs"
HELPER_EXE="$HELPER_OUT_DIR/update-helper.exe"

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

mkdir -p "$HELPER_OUT_DIR"

echo "[build-helper] bundling update-helper..." >&2
run_pnpm exec esbuild "$HELPER_SRC" \
  --bundle \
  --platform=node \
  --target=node18 \
  --format=cjs \
  --outfile="$HELPER_BUNDLE"

echo "[build-helper] packaging update-helper.exe..." >&2
run_pnpm exec pkg "$HELPER_BUNDLE" \
  --targets node18-win-x64 \
  --output "$HELPER_EXE" \
  --no-bytecode \
  --public

if [ ! -f "$HELPER_EXE" ]; then
  echo "[build-helper] Error: update-helper.exe not created at $HELPER_EXE" >&2
  exit 1
fi

echo "[build-helper] done: $HELPER_EXE" >&2
