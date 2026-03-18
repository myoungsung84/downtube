#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BIN_DIR="${ROOT_DIR}/bin"
TARGET_PLATFORM="${1:-auto}"

detect_platform() {
  if [[ "${TARGET_PLATFORM}" != "auto" ]]; then
    printf '%s\n' "${TARGET_PLATFORM}"
    return
  fi

  case "$(uname -s)" in
    Darwin) printf '%s\n' "darwin" ;;
    MINGW*|MSYS*|CYGWIN*) printf '%s\n' "win32" ;;
    Linux)
      if command -v powershell.exe >/dev/null 2>&1; then
        printf '%s\n' "win32"
      else
        printf '%s\n' "linux"
      fi
      ;;
    *) printf '%s\n' "unknown" ;;
  esac
}

log() {
  printf '[tools] %s\n' "$1"
}

copy_if_missing() {
  local src="$1"
  local dest="$2"
  local chmod_mode="${3:-}"

  if [[ -f "${dest}" ]]; then
    log "skip $(basename "${dest}")"
    return
  fi

  cp "${src}" "${dest}"

  if [[ -n "${chmod_mode}" ]]; then
    chmod "${chmod_mode}" "${dest}"
  fi

  log "prepared $(basename "${dest}")"
}

download_if_missing() {
  local url="$1"
  local dest="$2"
  local chmod_mode="${3:-}"

  if [[ -f "${dest}" ]]; then
    log "skip $(basename "${dest}")"
    return
  fi

  if ! command -v curl >/dev/null 2>&1; then
    echo "Error: curl not found." >&2
    exit 1
  fi

  curl -L --fail --silent --show-error "${url}" -o "${dest}"

  if [[ -n "${chmod_mode}" ]]; then
    chmod "${chmod_mode}" "${dest}"
  fi

  log "downloaded $(basename "${dest}")"
}

prepare_ffmpeg_tools() {
  local platform="$1"
  local ffmpeg_src
  local ffprobe_src
  local ffmpeg_dest
  local ffprobe_dest

  ffmpeg_src="$(node -p "require('ffmpeg-static')")"
  ffprobe_src="$(node -p "require('ffprobe-static').path")"

  if [[ "${platform}" == "win32" ]]; then
    ffmpeg_dest="${BIN_DIR}/ffmpeg.exe"
    ffprobe_dest="${BIN_DIR}/ffprobe.exe"
    copy_if_missing "${ffmpeg_src}" "${ffmpeg_dest}"
    copy_if_missing "${ffprobe_src}" "${ffprobe_dest}"
    return
  fi

  ffmpeg_dest="${BIN_DIR}/ffmpeg"
  ffprobe_dest="${BIN_DIR}/ffprobe"
  copy_if_missing "${ffmpeg_src}" "${ffmpeg_dest}" "755"
  copy_if_missing "${ffprobe_src}" "${ffprobe_dest}" "755"
}

prepare_ytdlp() {
  local platform="$1"

  case "${platform}" in
    win32)
      download_if_missing \
        "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" \
        "${BIN_DIR}/yt-dlp.exe"
      ;;
    darwin)
      download_if_missing \
        "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos" \
        "${BIN_DIR}/yt-dlp" \
        "755"
      ;;
    *)
      log "skip yt-dlp for unsupported platform: ${platform}"
      ;;
  esac
}

main() {
  local platform

  platform="$(detect_platform)"
  mkdir -p "${BIN_DIR}"

  log "root: ${ROOT_DIR}"
  log "platform: ${platform}"

  if [[ "${platform}" != "darwin" && "${platform}" != "win32" ]]; then
    log "skip binary ensure on this platform"
    exit 0
  fi

  prepare_ytdlp "${platform}"
  prepare_ffmpeg_tools "${platform}"
  log "done"
}

main "$@"
