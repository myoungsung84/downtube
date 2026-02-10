#!/usr/bin/env bash
set -euo pipefail

# -------------------------
# Preconditions
# -------------------------
if ! command -v docker >/dev/null 2>&1; then
  echo "❌ ERROR: docker not found. Install or configure Docker Desktop."
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "⛔ ERROR: Docker is not running. Start Docker Desktop first."
  exit 1
fi
if ! command -v curl >/dev/null 2>&1; then
  echo "❌ ERROR: curl not found."
  exit 1
fi

# -------------------------
# Resolve paths (repoRoot/llm fixed)
# -------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LLM_DIR="$REPO_ROOT/llm"
ENV_FILE="$LLM_DIR/.env"
COMPOSE_FILE="$LLM_DIR/compose.yml"
MODELS_DIR="$LLM_DIR/models"

cd "$LLM_DIR"

# -------------------------
# Load env
# -------------------------
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

: "${LLM_PORT:=18080}"
: "${MODEL_FILE:=qwen2.5-7b-instruct-q4_k_m.gguf}"
: "${MODEL_URL:=}"
: "${LLM_HEALTH_TIMEOUT_SEC:=180}"
: "${LLM_PROFILE:=cpu}"   # cpu | gpu

mkdir -p "$MODELS_DIR"
MODEL_PATH="$MODELS_DIR/${MODEL_FILE}"

# -------------------------
# Download model if missing
# -------------------------
if [ ! -f "$MODEL_PATH" ]; then
  if [ -z "${MODEL_URL:-}" ]; then
    echo "❌ ERROR: Model file not found and MODEL_URL is empty."
    echo "       Expected: $MODEL_PATH"
    exit 1
  fi

  echo "⬇️  Downloading model"
  echo "   → $MODEL_PATH"
  echo "   🌐 $MODEL_URL"

  curl -L -C - --fail --retry 3 --retry-delay 2 \
    -o "$MODEL_PATH" \
    "$MODEL_URL"

  echo "✅ Model download complete"
fi

# -------------------------
# Start containers
# -------------------------
PROFILE="cpu"
[ "${LLM_PROFILE:-cpu}" = "gpu" ] && PROFILE="gpu"

echo "🚀 Starting LLM (profile: $PROFILE)"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" --profile "$PROFILE" up -d

echo
echo "🌐 LLM endpoint: http://localhost:${LLM_PORT}"
echo "⏳ Waiting for health check (timeout: ${LLM_HEALTH_TIMEOUT_SEC}s)"

# -------------------------
# Wait for /health
# -------------------------
start_ts="$(date +%s)"
last_out=""

while true; do
  out="$(curl -sS --max-time 2 "http://localhost:${LLM_PORT}/health" || true)"
  last_out="$out"

  if [ -n "$out" ] && ! echo "$out" | grep -q "Loading model"; then
    echo "✅ LLM is ready"
    break
  fi

  now_ts="$(date +%s)"
  elapsed="$((now_ts - start_ts))"

  if [ "$elapsed" -ge "$LLM_HEALTH_TIMEOUT_SEC" ]; then
    echo "⛔ ERROR: LLM did not become ready within timeout"
    echo "Last response:"
    echo "$last_out"
    echo "🔍 Check logs:"
    echo "   docker compose --env-file \"$ENV_FILE\" -f \"$COMPOSE_FILE\" logs -f"
    exit 1
  fi

  echo "… loading (${elapsed}s / ${LLM_HEALTH_TIMEOUT_SEC}s)"
  sleep 2
done

echo "🎉 Done."
