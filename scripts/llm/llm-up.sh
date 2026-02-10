#!/usr/bin/env bash
set -euo pipefail

# Docker 실행 여부 체크 (up에만)
if ! command -v docker >/dev/null 2>&1; then
  echo "❌ docker command not found. Docker Desktop 설치/설정을 확인해줘."
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker가 실행 중이 아니야. Docker Desktop을 먼저 실행해줘."
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "❌ curl not found. (Windows Git Bash는 보통 기본 포함)"
  exit 1
fi

cd "$(dirname "$0")/../llm"

# env 로드
if [ -f ".env" ]; then
  # shellcheck disable=SC1091
  source ".env"
fi

: "${LLM_PORT:=18080}"
: "${MODEL_FILE:=qwen2.5-7b-instruct-q4_k_m.gguf}"
: "${MODEL_URL:=}"
: "${LLM_HEALTH_TIMEOUT_SEC:=180}"  # 기본 3분

mkdir -p models

MODEL_PATH="models/${MODEL_FILE}"

# 모델 자동 다운로드
if [ ! -f "$MODEL_PATH" ]; then
  if [ -z "$MODEL_URL" ]; then
    echo "❌ Model not found: $MODEL_PATH"
    echo "   그리고 MODEL_URL이 비어있어 자동 다운로드도 못함. llm/.env 확인해줘."
    exit 1
  fi

  echo "⬇️  Download model → $MODEL_PATH"
  echo "   URL: $MODEL_URL"
  echo "   (중단돼도 재개 가능: curl -L -C - ... )"

  # -L: redirect follow
  # -C -: resume
  # -o: output
  curl -L -C - --fail --retry 3 --retry-delay 2 \
    -o "$MODEL_PATH" \
    "$MODEL_URL"

  echo "✅ Model downloaded"
fi

docker compose up -d

echo
echo "✅ LLM up → http://localhost:${LLM_PORT}"

echo "Health (waiting until ready, timeout: ${LLM_HEALTH_TIMEOUT_SEC}s):"

# health ready 대기
start_ts="$(date +%s)"
last_out=""

while true; do
  # -f: HTTP 4xx/5xx면 실패 코드로 처리 (그래도 we handle)
  # --max-time: 네트워크 hang 방지
  out="$(curl -sS --max-time 2 "http://localhost:${LLM_PORT}/health" || true)"
  last_out="$out"

  # 로딩 중이면 보통 {"error":{"message":"Loading model"...}} 형태
  if [ -n "$out" ] && ! echo "$out" | grep -q "Loading model"; then
    echo "$out"
    echo "✅ Ready"
    break
  fi

  now_ts="$(date +%s)"
  elapsed="$((now_ts - start_ts))"
  if [ "$elapsed" -ge "$LLM_HEALTH_TIMEOUT_SEC" ]; then
    echo "$last_out"
    echo "❌ Not ready (timeout). 컨테이너 로그를 확인해봐: docker logs -f downtube-llm"
    exit 1
  fi

  echo "… loading (${elapsed}s/${LLM_HEALTH_TIMEOUT_SEC}s)"
  sleep 2
done

echo
