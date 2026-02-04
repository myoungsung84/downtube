#!/usr/bin/env bash
set -euo pipefail

# 1) TypeScript typecheck (node + web)
npm run typecheck

# 2) Electron + Vite build
electron-vite build
