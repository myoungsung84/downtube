import axios from 'axios'
import { execSync } from 'child_process'
import { app } from 'electron'
import log from 'electron-log'
import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'fs'
import fs from 'fs'
import { join } from 'path'
import path from 'path'

const BIN_DIR = join(__dirname, '../../bin')
const YTDLP_PATH = join(BIN_DIR, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp')
const YTDLP_RELEASE_URL = 'https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest'

interface GitHubAsset {
  name: string
  browser_download_url: string
}

function setupLogdir(): void {
  const downloadDir = path.join(app.getPath('downloads'), 'DownTube')
  if (!fs.existsSync(downloadDir)) {
    mkdirSync(downloadDir, { recursive: true })
  }
  log.transports.file.resolvePathFn = () => path.join(downloadDir, 'down-tube.log')
}

async function updateYtDlp(): Promise<void> {
  let localVersion = 'none'

  try {
    if (existsSync(YTDLP_PATH)) {
      localVersion = execSync(`${YTDLP_PATH} --version`).toString().trim()
    }
  } catch (e) {
    console.warn('[yt-dlp] 로컬 버전 확인 실패:', e)
  }

  try {
    const { data } = await axios.get(YTDLP_RELEASE_URL)
    const latestVersion: string = data.tag_name.replace(/^v/, '')
    const assetName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
    const asset = (data.assets as GitHubAsset[]).find((a) => a.name === assetName)
    const downloadUrl: string | undefined = asset?.browser_download_url

    if (!downloadUrl) throw new Error('yt-dlp 최신 바이너리 다운로드 URL을 찾을 수 없습니다.')

    if (localVersion === latestVersion) {
      console.log(`[yt-dlp] 최신 버전 사용 중 (${localVersion})`)
      return
    }

    console.log(`[yt-dlp] 업데이트: ${localVersion} → ${latestVersion}`)

    const res = await axios.get(downloadUrl, { responseType: 'arraybuffer' })
    if (!existsSync(BIN_DIR)) mkdirSync(BIN_DIR, { recursive: true })

    writeFileSync(YTDLP_PATH, res.data)
    chmodSync(YTDLP_PATH, 0o755)

    console.log('[yt-dlp] 업데이트 완료')
  } catch (error) {
    console.error('[yt-dlp] 업데이트 실패:', error)
  }
}

export async function initializeApp(): Promise<void> {
  console.log('[init] 앱 초기화 시작')
  await updateYtDlp()
  setupLogdir()
  console.log('[init] 앱 초기화 완료')
}
