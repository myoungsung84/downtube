#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../llm"
docker compose down >/dev/null 2>&1 || true
echo "✅ LLM down"
