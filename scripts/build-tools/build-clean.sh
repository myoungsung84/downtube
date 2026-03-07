#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

TARGETS=(
  "dist"
  "out"
)

echo "[clean] root: ${ROOT_DIR}"

for target in "${TARGETS[@]}"; do
  target_path="${ROOT_DIR}/${target}"

  if [[ -e "${target_path}" ]]; then
    echo "[clean] removing ${target}"
    rm -rf "${target_path}"
  else
    echo "[clean] skip ${target} (not found)"
  fi
done

echo "[clean] done"