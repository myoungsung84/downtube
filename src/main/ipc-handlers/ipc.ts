import { app, BrowserWindow, ipcMain, shell } from 'electron'
import log from 'electron-log'
import fs, { mkdirSync } from 'fs'
import path from 'path'
import url from 'url'

import type { DownloadJob } from '../../types/download.types'
import type { InitState } from '../../types/init.types'
import { initializeApp } from '../common/initialize-app'
import { downloadsQueue, onDownloadsEvent } from '../downloads'
import { downloadInfo } from '../downloads/yt-dlp-utils'

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
