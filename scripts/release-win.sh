#!/usr/bin/env bash
set -euo pipefail

command -v gh >/dev/null 2>&1 || { echo "Error: gh CLI not found."; exit 1; }

APP_NAME="$(node -p "require('./package.json').name")"
APP_VERSION="$(node -p "require('./package.json').version")"
TAG_NAME="v${APP_VERSION}-win"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Error: working tree is dirty. Commit changes before release."
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if git rev-parse --verify "origin/${BRANCH}" >/dev/null 2>&1; then
  LOCAL_SHA="$(git rev-parse HEAD)"
  REMOTE_SHA="$(git rev-parse "origin/${BRANCH}")"
  if [ "$LOCAL_SHA" != "$REMOTE_SHA" ]; then
    echo "Error: local branch is not in sync with origin/${BRANCH}. Push before release."
    exit 1
  fi
fi

bash scripts/build.sh
ZIP_PATH="$(bash scripts/build-win.sh)"

if [ -z "${ZIP_PATH:-}" ] || [ ! -f "$ZIP_PATH" ]; then
  echo "Error: asset not found: $ZIP_PATH"
  exit 1
fi

if ! git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
  git tag "$TAG_NAME"
fi

if ! git ls-remote --tags origin | grep -q "refs/tags/${TAG_NAME}$"; then
  git push origin "$TAG_NAME"
fi

NOTES="$(printf "Windows unpacked build\nCommit: %s\nAsset: %s\n" "$(git rev-parse --short HEAD)" "$(basename "$ZIP_PATH")")"

if gh release view "$TAG_NAME" >/dev/null 2>&1; then
  gh release upload "$TAG_NAME" "$ZIP_PATH" --clobber
else
  gh release create "$TAG_NAME" \
    --draft \
    --title "$TAG_NAME" \
    --notes "$NOTES" \
    "$ZIP_PATH"
fi

echo "OK"
echo "app:   $APP_NAME"
echo "tag:   $TAG_NAME"
echo "asset: $ZIP_PATH"
echo "next:  publish the draft release on GitHub"
