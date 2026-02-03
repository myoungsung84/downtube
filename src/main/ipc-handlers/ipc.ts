import { VideoInfo } from '@src/types/video-info.types'
import { spawn } from 'child_process'
import { app, BrowserWindow, ipcMain, nativeImage, shell } from 'electron'
import log from 'electron-log'
import fs, { mkdirSync, readFileSync } from 'fs'
import path, { join } from 'path'
import url from 'url'

import type { DownloadJob } from '../../types/download.types'
import { downloadsQueue, onDownloadsEvent } from '../downloads'
import { locateYtDlp } from '../downloads/yt-dlp-utils'

const registeredHandlers = new Set<string>()
let playerWindow: BrowserWindow | null = null

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
  // ✅ downloads 이벤트 → renderer로 브릿지
  //   - 기존 호환: download-progress / download-done 유지
  //   - 신규: downloads:event로 raw 이벤트 전달 (job-added 포함)
  // ------------------------------------------------------------
  const off = onDownloadsEvent((ev) => {
    // ✅ 새 채널: 화면이 리스트를 직접 구성할 수 있게 raw 이벤트 전달
    mainWindow.webContents.send('downloads:event', ev)

    // ✅ 기존 채널 유지(너 기존 DownloadsScreen 코드가 onDownloadProgress/onDownloadDone 쓰는걸로 보임)
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

    // 실패도 필요하면 여기에 추가 가능
    // if (job.status === 'failed') {
    //   mainWindow.webContents.send('download-failed', { url: job.url, error: job.error ?? '' })
    // }
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
  // ✅ download-video: 큐 enqueue
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
  // ✅ download-audio: 큐 enqueue (오디오 전용)
  // ------------------------------------------------------------
  safeSetHandler('download-audio', async (_, url: string) => {
    if (downloadsQueue.hasUrl(url)) {
      return { success: false, message: 'Already downloading' }
    }

    const downloadDir = path.join(app.getPath('downloads'), 'DownTube')
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const baseName = `${timestamp}_AUD`

    const job: DownloadJob = {
      id: `${timestamp}:${Math.random().toString(16).slice(2)}`,
      url,
      type: 'audio',
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
  // ✅ download-playlist: playlist URL → 아이템별 enqueue
  //   - type: 'video' | 'audio'
  //   - playlistLimit: 과다운로드 방지
  // ------------------------------------------------------------
  safeSetHandler(
    'download-playlist',
    async (
      _,
      payload: {
        url: string
        type: 'video' | 'audio'
        playlistLimit?: number
        filenamePrefix?: string
      }
    ) => {
      const playlistUrl = payload.url
      const type = payload.type
      const playlistLimit = payload.playlistLimit ?? 50

      const downloadDir = path.join(app.getPath('downloads'), 'DownTube')

      // prefix는 요청에서 받거나 timestamp 기반
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const filenamePrefix = payload.filenamePrefix ?? `${timestamp}_PL`

      const res = await downloadsQueue.enqueuePlaylist({
        playlistUrl,
        type,
        outputDir: downloadDir,
        filenamePrefix,
        playlistLimit
      })

      return { success: true, ...res }
    }
  )

  // ------------------------------------------------------------
  // ✅ download-set-type: 리스트 아이템에서 오디오/비디오 변경
  //   - queued 상태에서만 변경 가능
  // ------------------------------------------------------------
  safeSetHandler(
    'download-set-type',
    async (_, payload: { id: string; type: 'video' | 'audio' }) => {
      return downloadsQueue.setType(payload.id, payload.type)
    }
  )

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

  // ------------------------------------------------------------
  // (옵션) Renderer가 리스트를 한 번에 받고 싶으면
  // ------------------------------------------------------------
  safeSetHandler('downloads-list', async () => downloadsQueue.getJobs())

  // ------------------------------------------------------------
  // ✅ queue control: start / pause
  // - enqueue는 자동 시작 안 함
  // - Start/Resume 버튼에서 downloads-start 호출
  // - Pause 버튼에서 downloads-pause 호출
  // ------------------------------------------------------------
  safeSetHandler('downloads-start', async () => {
    downloadsQueue.start()
    return { success: true }
  })

  safeSetHandler('downloads-pause', async () => {
    await downloadsQueue.pause()
    return { success: true }
  })
}
