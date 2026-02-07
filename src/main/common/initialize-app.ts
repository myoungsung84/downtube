// src/main/common/initialize-app.ts
import axios from 'axios'
import { execSync } from 'child_process'
import { app } from 'electron'
import log from 'electron-log'
import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'fs'
import path, { join } from 'path'

const YTDLP_RELEASE_URL = 'https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest'

interface GitHubAsset {
  name: string
  browser_download_url: string
}

function getBinDir(): string {
  // dev: <repo>/bin
  // prod: <App>.app/Contents/Resources/bin
  return app.isPackaged ? join(process.resourcesPath, 'bin') : join(__dirname, '../../bin')
}

function getYtDlpPath(binDir: string): string {
  return join(binDir, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp')
}

function getAssetNameForPlatform(): string {
  if (process.platform === 'win32') return 'yt-dlp.exe'
  if (process.platform === 'darwin') return 'yt-dlp_macos'
  // If you want Linux support later, switch this to 'yt-dlp_linux' explicitly.
  return 'yt-dlp'
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

async function updateYtDlp(): Promise<void> {
  const binDir = getBinDir()
  const ytdlpPath = getYtDlpPath(binDir)
  const localVersion = tryGetLocalYtDlpVersion(ytdlpPath)

  try {
    const { data } = await axios.get(YTDLP_RELEASE_URL, {
      headers: {
        // GitHub API can be picky about User-Agent
        'User-Agent': 'Downtube'
      }
    })

    const latestVersion: string = String(data.tag_name).replace(/^v/, '')
    const assetName = getAssetNameForPlatform()

    const asset = (data.assets as GitHubAsset[]).find((a) => a.name === assetName)
    const downloadUrl: string | undefined = asset?.browser_download_url
    if (!downloadUrl) {
      throw new Error(`[yt-dlp] Download URL not found for asset: ${assetName}`)
    }

    if (localVersion === latestVersion) {
      console.log(`[yt-dlp] Already up to date (${localVersion})`)
      return
    }

    console.log(`[yt-dlp] Updating: ${localVersion} -> ${latestVersion} (${assetName})`)

    const res = await axios.get(downloadUrl, { responseType: 'arraybuffer' })

    ensureDir(binDir)
    writeFileSync(ytdlpPath, res.data)
    chmodSync(ytdlpPath, 0o755)

    // Fail fast if we accidentally downloaded a python script on macOS
    assertMacBinary(ytdlpPath)

    console.log('[yt-dlp] Update complete')
  } catch (error) {
    console.error('[yt-dlp] Update failed:', error)
  }
}

export async function initializeApp(): Promise<void> {
  console.log('[init] App initialization started')

  // Log file should be set early so we capture the rest
  setupLogdir()

  // Update yt-dlp before downloads start
  await updateYtDlp()

  console.log('[init] App initialization completed')
}
