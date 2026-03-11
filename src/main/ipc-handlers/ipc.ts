import { spawn } from 'child_process'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import log from 'electron-log'
import fs, { mkdirSync } from 'fs'
import path from 'path'
import url from 'url'

import type { InitState } from '../../types/init.types'
import { initializeApp } from '../common/initialize-app'
import { downloadsQueue, onDownloadsEvent } from '../downloads'
import { locateFfmpeg } from '../downloads/adapters/ffmpeg/ffmpeg'
import { downloadInfo } from '../downloads/adapters/yt-dlp/yt-dlp-info'
import type { DownloadJob } from '../downloads/types'

const registeredHandlers = new Set<string>()
let playerWindow: BrowserWindow | null = null
let initState: InitState = { status: 'idle' }
let initInFlight: Promise<InitState> | null = null

function safeSetHandler(channel: string, handler: Parameters<typeof ipcMain.handle>[1]): void {
  if (registeredHandlers.has(channel)) {
    log.warn(`[${channel}] already registered, skipping`)
    return
  }
  ipcMain.handle(channel, handler)
  registeredHandlers.add(channel)
}

export const ipcHandler = (mainWindow: BrowserWindow): void => {
  const broadcastInitState = (state: InitState): void => {
    initState = state
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('app:init-state', state)
    }
  }

  const off = onDownloadsEvent((ev) => {
    mainWindow.webContents.send('downloads:event', ev)
  })

  mainWindow.on('closed', () => off())

  safeSetHandler('app:init', async () => {
    if (initState.status === 'ready') {
      return initState
    }

    if (initInFlight) {
      return initInFlight
    }

    broadcastInitState({ status: 'running', step: 'setting-up', progress: 0 })

    initInFlight = initializeApp((state) => {
      broadcastInitState(state)
    })
      .then((state) => {
        broadcastInitState(state)
        return state
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
        const state: InitState = { status: 'error', message }
        broadcastInitState(state)
        return state
      })
      .finally(() => {
        initInFlight = null
      })

    return initInFlight
  })

  safeSetHandler('download-player', async (_, payload: { id: string }) => {
    if (!payload?.id) return { success: false, message: 'Job not found' }

    const job = downloadsQueue.getJob(payload.id)
    if (!job) return { success: false, message: 'Job not found' }
    if (job.status !== 'completed' || job.type !== 'video') {
      return { success: false, message: 'Only completed video can be played' }
    }

    const filePath = job.finalFilePath ?? job.outputFile
    if (!filePath) return { success: false, message: 'Output file path not found' }
    if (!fs.existsSync(filePath)) return { success: false, message: 'Output file does not exist' }
    const mediaUrl = new URL('downtube-media://media')
    mediaUrl.searchParams.set('path', filePath)
    const mediaSrc = mediaUrl.toString()

    if (playerWindow && !playerWindow.isDestroyed()) {
      playerWindow.close()
    }

    playerWindow = new BrowserWindow({
      width: 1280,
      height: 820,
      minWidth: 980,
      minHeight: 640,
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true
      }
    })

    const devPort = mainWindow?.webContents.getURL().match(/localhost:(\d+)/)?.[1] ?? '5173'
    const playerHash = `/player?${new URLSearchParams({ src: mediaSrc }).toString()}`
    const playerUrl = !app.isPackaged
      ? `http://localhost:${devPort}/#${playerHash}`
      : url.format({
          pathname: path.join(__dirname, '../renderer/index.html'),
          protocol: 'file:',
          slashes: true,
          hash: playerHash
        })

    await playerWindow.loadURL(playerUrl)

    if (!app.isPackaged) {
      playerWindow.webContents.openDevTools({ mode: 'detach' })
    }

    playerWindow.show()
    return { success: true }
  })

  safeSetHandler('download-dir-open', async () => {
    try {
      const downloadDir = path.join(app.getPath('downloads'), 'DownTube')
      if (!fs.existsSync(downloadDir)) {
        mkdirSync(downloadDir, { recursive: true })
      }

      const result = await shell.openPath(downloadDir)
      if (result) {
        return { success: false, message: result || 'Failed to open download directory' }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to open download directory'
      }
    }
  })

  safeSetHandler('download-item-open', async (_, filePath: string) => {
    try {
      if (typeof filePath !== 'string' || filePath.trim().length === 0) {
        return { success: false, message: 'Invalid path' }
      }

      shell.showItemInFolder(filePath)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to open download item'
      }
    }
  })

  safeSetHandler('media-meta-read', async (_, filePath: string) => {
    try {
      if (typeof filePath !== 'string' || filePath.trim().length === 0) {
        return { success: false, message: 'Invalid path' }
      }
      if (!fs.existsSync(filePath)) {
        return { success: false, message: 'File not found' }
      }

      const ffprobePath = locateFfmpeg().replace(
        /ffmpeg(\.exe)?$/i,
        process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe'
      )
      const ffprobeResult = await new Promise<{
        success: boolean
        stdout?: string
        message?: string
      }>((resolve) => {
        const proc = spawn(
          ffprobePath,
          ['-v', 'error', '-show_entries', 'format_tags=title,artist', '-of', 'json', filePath],
          { windowsHide: true }
        )

        let stdout = ''
        let stderr = ''

        proc.stdout.on('data', (data: Buffer) => {
          stdout += data.toString()
        })

        proc.stderr.on('data', (data: Buffer) => {
          stderr += data.toString()
        })

        proc.on('error', (error: Error) => {
          resolve({ success: false, message: error.message })
        })

        proc.on('close', (code: number | null) => {
          const exitCode = code ?? -1
          if (exitCode !== 0) {
            const message = stderr.trim() || `ffprobe exited with code ${exitCode}`
            resolve({ success: false, message })
            return
          }
          resolve({ success: true, stdout })
        })
      })

      if (!ffprobeResult.success) {
        return { success: false, message: ffprobeResult.message ?? 'Failed to read media metadata' }
      }

      const raw = JSON.parse(ffprobeResult.stdout ?? '{}') as {
        format?: { tags?: { title?: unknown; artist?: unknown; ARTIST?: unknown } }
      }

      const title = typeof raw.format?.tags?.title === 'string' ? raw.format.tags.title : undefined
      const artistTag = raw.format?.tags?.artist ?? raw.format?.tags?.ARTIST
      const artist = typeof artistTag === 'string' ? artistTag : undefined

      return { success: true, ...(title ? { title } : {}), ...(artist ? { artist } : {}) }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to read media metadata'
      }
    }
  })

  safeSetHandler('download-video', async (_, url: string) => {
    if (downloadsQueue.hasUrl(url)) {
      return { success: false, message: 'Already downloading' }
    }

    const downloadDir = path.join(app.getPath('downloads'), 'DownTube')
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const baseName = `${timestamp}_VOD`

    const info = await downloadInfo(url).catch(() => undefined)

    const job: DownloadJob = {
      id: `${timestamp}:${Math.random().toString(16).slice(2)}`,
      url,
      type: 'video',
      status: 'queued',
      filename: baseName,
      outputDir: downloadDir,
      progress: { percent: 0, current: null },
      createdAt: Date.now(),
      info: info
    }

    downloadsQueue.enqueue(job)
    return { success: true }
  })

  safeSetHandler('download-audio', async (_, url: string) => {
    if (downloadsQueue.hasUrl(url)) {
      return { success: false, message: 'Already downloading' }
    }

    const downloadDir = path.join(app.getPath('downloads'), 'DownTube')
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const baseName = `${timestamp}_AUD`

    const info = await downloadInfo(url).catch(() => undefined)

    const job: DownloadJob = {
      id: `${timestamp}:${Math.random().toString(16).slice(2)}`,
      url,
      type: 'audio',
      status: 'queued',
      filename: baseName,
      outputDir: downloadDir,
      progress: { percent: 0, current: null },
      createdAt: Date.now(),
      info: info
    }

    downloadsQueue.enqueue(job)
    return { success: true }
  })

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

  safeSetHandler(
    'download-set-type',
    async (_, payload: { id: string; type: 'video' | 'audio' }) => {
      return downloadsQueue.setType(payload.id, payload.type)
    }
  )

  safeSetHandler('download-stop', async (_, url: string) => {
    try {
      return await downloadsQueue.cancelByUrl(url)
    } catch (error) {
      log.error('Error stopping download:', error)
      return { success: false, message: 'Failed to stop download' }
    }
  })

  safeSetHandler('download-remove', async (_, payload: { id: string }) => {
    try {
      const job = downloadsQueue.getJob(payload.id)
      if (!job) return { success: false, message: 'Job not found' }

      if (job.status === 'running') {
        return { success: false, message: 'Cannot remove running job' }
      }

      downloadsQueue.remove(payload.id)
      return { success: true }
    } catch (error) {
      log.error('Error removing download job:', error)
      return { success: false, message: 'Failed to remove download job' }
    }
  })

  safeSetHandler('downloads-list', async () => downloadsQueue.getJobs())

  safeSetHandler('downloads-start', async () => {
    downloadsQueue.start()
    return { success: true }
  })

  safeSetHandler('downloads-pause', async () => {
    await downloadsQueue.pause()
    return { success: true }
  })
}
