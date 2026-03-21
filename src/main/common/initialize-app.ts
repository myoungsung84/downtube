// src/main/common/initialize-app.ts
import axios from 'axios'
import { execSync } from 'child_process'
import { app } from 'electron'
import log from 'electron-log'
import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'fs'
import path, { join } from 'path'

import type { InitState } from '../../types/init.types'
import { ensureSettingsLanguage } from '../settings/settings-store'
import { normalizeUnknownAppError } from './app-error'

const YTDLP_DOWNLOAD_URLS = {
  win32: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
  darwin: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos'
} as const

function getBinDir(): string {
  // dev: <repo>/bin
  // prod: <App>.app/Contents/Resources/bin
  return app.isPackaged ? join(process.resourcesPath, 'bin') : join(__dirname, '../../bin')
}

function getYtDlpPath(binDir: string): string {
  return join(binDir, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp')
}

function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true })
}

function setupLogdir(): void {
  const downloadDir = path.join(app.getPath('downloads'), 'DownTube')
  ensureDir(downloadDir)

  log.transports.file.resolvePathFn = () => path.join(downloadDir, 'down-tube.log')
}

function tryGetLocalYtDlpVersion(ytdlpPath: string): string {
  try {
    if (!existsSync(ytdlpPath)) return 'none'
    return execSync(`"${ytdlpPath}" --version`).toString().trim()
  } catch (e) {
    console.warn('[yt-dlp] Failed to get local version:', e)
    return 'unknown'
  }
}

function assertMacBinary(ytdlpPath: string): void {
  // We must not ship a python script/zipapp on macOS (will depend on system python).
  if (process.platform !== 'darwin') return

  const out = execSync(`file "${ytdlpPath}"`).toString()
  if (!out.includes('Mach-O')) {
    throw new Error(`[yt-dlp] Expected macOS Mach-O binary, but got: ${out.trim()}`)
  }
}

type InitProgressReporter = (state: Extract<InitState, { status: 'running' }>) => void

async function updateYtDlp(reportProgress?: InitProgressReporter): Promise<void> {
  reportProgress?.({ status: 'running', step: 'checking-binaries', progress: 30 })

  const binDir = getBinDir()
  const ytdlpPath = getYtDlpPath(binDir)
  const localVersion = tryGetLocalYtDlpVersion(ytdlpPath)
  const downloadUrl = YTDLP_DOWNLOAD_URLS[process.platform as keyof typeof YTDLP_DOWNLOAD_URLS]

  if (localVersion !== 'none' && localVersion !== 'unknown') {
    assertMacBinary(ytdlpPath)
    console.log(`[yt-dlp] Using bundled binary (${localVersion})`)
    return
  }

  try {
    if (!downloadUrl) {
      throw new Error(`[yt-dlp] Unsupported platform: ${process.platform}`)
    }

    console.log('[yt-dlp] Bundled binary not available. Running fallback download.')

    reportProgress?.({ status: 'running', step: 'downloading-binaries', progress: 60 })

    const res = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Downtube'
      }
    })

    ensureDir(binDir)
    writeFileSync(ytdlpPath, res.data)
    chmodSync(ytdlpPath, 0o755)

    // Fail fast if we accidentally downloaded a python script on macOS
    assertMacBinary(ytdlpPath)

    reportProgress?.({ status: 'running', step: 'finalizing', progress: 90 })

    console.log('[yt-dlp] Update complete')
  } catch (error) {
    console.error('[yt-dlp] Update failed:', error)
    throw error
  }
}

export async function initializeApp(reportProgress?: InitProgressReporter): Promise<InitState> {
  console.log('[init] App initialization started')

  try {
    reportProgress?.({ status: 'running', step: 'setting-up', progress: 10 })
    ensureSettingsLanguage()

    // Log file should be set early so we capture the rest
    setupLogdir()

    // Build-time binary prepare is the primary path. Runtime only fills the gap when missing.
    await updateYtDlp(reportProgress)

    reportProgress?.({ status: 'running', step: 'starting-services', progress: 100 })

    console.log('[init] App initialization completed')
    return { status: 'ready' }
  } catch (error) {
    const normalizedError = normalizeUnknownAppError('init.initialization_failed', error)
    const detail = normalizedError.detail ?? 'Unknown initialization error'
    console.error('[init] App initialization failed:', detail)
    return { status: 'error', error: normalizedError }
  }
}
