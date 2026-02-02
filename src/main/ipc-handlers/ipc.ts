import { VideoInfo } from '@src/types/video-info.types'
import { spawn } from 'child_process'
import { app, BrowserWindow, ipcMain, nativeImage, shell } from 'electron'
import log from 'electron-log'
import fs, { mkdirSync, readFileSync } from 'fs'
import path, { join } from 'path'
import url from 'url'

import { downloadsQueue, onDownloadsEvent } from '../downloads'
import type { DownloadJob } from '../downloads/download.types'

const isWindows = process.platform === 'win32'
const registeredHandlers = new Set<string>()
let playerWindow: BrowserWindow | null = null

/**
 * yt-dlp 바이너리 경로를 찾는 함수
 * @returns yt-dlp 바이너리 경로
 */
function locateYtDlp(): string {
  const binaryName = isWindows ? `yt-dlp.exe` : 'yt-dlp'
  return app.isPackaged
    ? path.resolve(process.resourcesPath, 'bin', binaryName)
    : path.resolve(__dirname, '../../bin', binaryName)
}

/**
 * IPC 핸들러 등록
 * @param channel
 * @param handler
 */
function safeSetHandler(channel: string, handler: Parameters<typeof ipcMain.handle>[1]): void {
  if (registeredHandlers.has(channel)) {
    log.warn(`[${channel}] already registered, skipping`)
    return
  }
  ipcMain.handle(channel, handler)
  registeredHandlers.add(channel)
}

/**
 * 다운로드 핸들러
 * @param mainWindow 메인 윈도우
 */
export const ipcHandler = (mainWindow: BrowserWindow): void => {
  // ------------------------------------------------------------
  // ✅ downloads 이벤트 → 기존 renderer 이벤트 채널로 브릿지
  // ------------------------------------------------------------
  const off = onDownloadsEvent((ev) => {
    if (ev.type !== 'job-updated') return

    const job = ev.job

    // 진행률
    if (job.progress.current && (job.status === 'running' || job.status === 'completed')) {
      mainWindow.webContents.send('download-progress', {
        url: job.url,
        current: job.progress.current,
        percent: job.progress.percent
      })
    }

    // 완료
    if (job.status === 'completed' && job.outputFile) {
      mainWindow.webContents.send('download-done', { url: job.url, file: job.outputFile })
    }

    // 실패(기존엔 이벤트가 없었는데, 필요하면 추가 가능)
    // if (job.status === 'failed') { ... }
  })

  mainWindow.on('closed', () => off())

  // ------------------------------------------------------------
  // 기존 핸들러들 유지
  // ------------------------------------------------------------
  safeSetHandler('resolve-asset-path', (_, filename: string) => {
    const basePath = app.isPackaged
      ? join(process.resourcesPath, 'assets')
      : join(process.cwd(), 'assets')
    const filePath = join(basePath, filename)
    const ext = filename.split('.').pop()

    if (ext === 'svg') {
      const svgData = readFileSync(filePath)
      const base64 = svgData.toString('base64')
      return `data:image/svg+xml;base64,${base64}`
    } else {
      const image = nativeImage.createFromPath(filePath)
      return image.toDataURL()
    }
  })

  safeSetHandler('download-player', async (_, videoUrl: string) => {
    if (playerWindow && !playerWindow.isDestroyed()) {
      playerWindow.close()
    }

    playerWindow = new BrowserWindow({
      width: 800,
      height: 450,
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true
      }
    })

    const devPort = mainWindow?.webContents.getURL().match(/localhost:(\d+)/)?.[1] ?? '5173'
    const playerUrl = !app.isPackaged
      ? `http://localhost:${devPort}/#/player?url=${encodeURIComponent(videoUrl)}`
      : url.format({
          pathname: path.join(__dirname, '../renderer/index.html'),
          protocol: 'file:',
          slashes: true,
          hash: `/player?url=${encodeURIComponent(videoUrl)}`
        })

    await playerWindow.loadURL(playerUrl)
    playerWindow.show()
  })

  safeSetHandler('download-dir-open', async () => {
    const downloadDir = path.join(app.getPath('downloads'), 'DownTube')
    if (!fs.existsSync(downloadDir)) {
      mkdirSync(downloadDir, { recursive: true })
    }
    await shell.openPath(downloadDir)
  })

  safeSetHandler('download-info', async (_, url: string) => {
    const ytDlpPath = locateYtDlp()
    return new Promise((res, rej) => {
      const args = [
        '--no-check-certificate',
        '--no-cache-dir',
        '--no-warnings',
        '--no-playlist',
        '--dump-json',
        url
      ]
      const p = spawn(ytDlpPath, args)

      let json = ''
      p.stdout.on('data', (data) => {
        json += data.toString()
      })
      p.stderr.on('data', (data) => {
        log.error('[yt-dlp stderr]', data.toString())
      })
      p.on('error', (err) => {
        log.error('[yt-dlp error]', err)
        rej(new Error(`yt-dlp spawn failed: ${err.message}`))
      })
      p.on('close', (code) => {
        if (code === 0) {
          try {
            const info: VideoInfo = JSON.parse(json) as VideoInfo
            const bestCombined = info.formats
              ?.filter(
                (f) => f.ext === 'mp4' && f.acodec !== 'none' && f.vcodec !== 'none' && f.url
              )
              .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))[0]

            res({
              ...info,
              best_url: bestCombined?.url ?? ''
            })
          } catch (e) {
            rej(new Error(`Invalid JSON from yt-dlp: ${e}`))
          }
        } else {
          rej(new Error(`yt-dlp exited with code ${code}`))
        }
      })
    })
  })

  // ------------------------------------------------------------
  // ✅ download-video: 즉시 실행 → 큐 enqueue
  // ------------------------------------------------------------
  safeSetHandler('download-video', async (_, url: string) => {
    if (downloadsQueue.hasUrl(url)) {
      return { success: false, message: 'Already downloading' }
    }

    const downloadDir = path.join(app.getPath('downloads'), 'DownTube')

    const timestamp = Math.floor(Date.now() / 1000).toString()
    const baseName = `${timestamp}_VOD`

    const job: DownloadJob = {
      id: `${timestamp}:${Math.random().toString(16).slice(2)}`,
      url,
      type: 'video',
      status: 'queued',
      filename: baseName,
      outputDir: downloadDir,
      progress: { percent: 0, current: null },
      createdAt: Date.now()
    }

    downloadsQueue.enqueue(job)
    return { success: true }
  })

  // ------------------------------------------------------------
  // ✅ download-stop: 프로세스 kill → 큐 cancel
  // ------------------------------------------------------------
  safeSetHandler('download-stop', async (_, url: string) => {
    try {
      return await downloadsQueue.cancelByUrl(url)
    } catch (error) {
      log.error('Error stopping download:', error)
      return { success: false, message: 'Failed to stop download' }
    }
  })

  // (옵션) Renderer가 리스트를 한 번에 받고 싶으면
  // safeSetHandler('downloads-list', async () => downloadsQueue.getJobs())
}
