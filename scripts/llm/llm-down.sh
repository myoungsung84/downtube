#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LLM_DIR="$REPO_ROOT/llm"
COMPOSE_FILE="$LLM_DIR/compose.yml"
ENV_FILE="$LLM_DIR/.env"

cd "$LLM_DIR"

REMOVE_ORPHANS=0
for arg in "$@"; do
  case "$arg" in
    --clean|--remove-orphans) REMOVE_ORPHANS=1 ;;
  esac
done

if [ "$REMOVE_ORPHANS" -eq 1 ]; then
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down --remove-orphans >/dev/null 2>&1 || true
  echo "🧹 LLM down (orphans removed)"
else
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down >/dev/null 2>&1 || true
  echo "✅ LLM down"
fi
