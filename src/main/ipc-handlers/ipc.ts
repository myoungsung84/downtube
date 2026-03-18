import { app, BrowserWindow, ipcMain, shell } from 'electron'
import log from 'electron-log'
import fs, { mkdirSync } from 'fs'
import path from 'path'
import url from 'url'

import type { InitState } from '../../types/init.types'
import type { MediaSidecarData, ReadMediaSidecarResult } from '../../types/media-sidecar.types'
import type { SettingKey } from '../../types/settings.types'
import { initializeApp } from '../common/initialize-app'
import { downloadsQueue, onDownloadsEvent } from '../downloads'
import { downloadInfo } from '../downloads/adapters/yt-dlp/yt-dlp-info'
import type { DownloadJob } from '../downloads/types'
import { deleteLibraryItem, listLibraryItems } from '../library/library'
import { getSetting, getSettings, setSetting } from '../settings/settings-store'

const registeredHandlers = new Set<string>()
let playerWindow: BrowserWindow | null = null
let initState: InitState = { status: 'idle' }
let initInFlight: Promise<InitState> | null = null
const SIDECAR_THUMBNAIL_EXTENSIONS = ['.jpg', '.png', '.webp'] as const

function safeSetHandler(channel: string, handler: Parameters<typeof ipcMain.handle>[1]): void {
  if (registeredHandlers.has(channel)) {
    log.warn(`[${channel}] already registered, skipping`)
    return
  }
  ipcMain.handle(channel, handler)
  registeredHandlers.add(channel)
}

function getDownloadDir(): string {
  return path.join(app.getPath('downloads'), 'DownTube')
}

function getDownloadsRootDir(): string {
  return app.getPath('downloads')
}

async function openPlayerWindow(
  mainWindow: BrowserWindow,
  filePath: string
): Promise<{ success: boolean; message?: string }> {
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
}

function getSidecarBasePath(filePath: string): string {
  const extension = path.extname(filePath)
  return extension ? filePath.slice(0, -extension.length) : filePath
}

function resolveSidecarThumbnailPath(filePath: string): string | undefined {
  const sidecarBasePath = getSidecarBasePath(filePath)
  return SIDECAR_THUMBNAIL_EXTENSIONS.map((extension) => `${sidecarBasePath}${extension}`).find(
    (candidate) => fs.existsSync(candidate)
  )
}

function readMediaSidecar(filePath: string): ReadMediaSidecarResult {
  if (typeof filePath !== 'string' || filePath.trim().length === 0) {
    return { success: false, message: 'Invalid path' }
  }

  if (!fs.existsSync(filePath)) {
    return { success: false, message: 'File not found' }
  }

  const jsonPath = `${getSidecarBasePath(filePath)}.json`
  if (!fs.existsSync(jsonPath)) {
    return { success: false, message: 'Sidecar not found' }
  }

  try {
    const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as Partial<MediaSidecarData>
    const title =
      typeof raw.info?.title === 'string' ? raw.info.title.trim() || undefined : undefined
    const artist =
      typeof raw.info?.uploader === 'string'
        ? raw.info.uploader.trim() || undefined
        : typeof raw.info?.channel === 'string'
          ? raw.info.channel.trim() || undefined
          : undefined

    return {
      success: true,
      ...(title ? { title } : {}),
      ...(artist ? { artist } : {}),
      ...(raw.info ? { info: raw.info } : { info: null }),
      ...(resolveSidecarThumbnailPath(filePath)
        ? { thumbnailPath: resolveSidecarThumbnailPath(filePath) }
        : {}),
      sidecar: {
        id: typeof raw.id === 'string' ? raw.id : '',
        url: typeof raw.url === 'string' ? raw.url : '',
        type: raw.type === 'video' || raw.type === 'audio' ? raw.type : 'video',
        filename: typeof raw.filename === 'string' ? raw.filename : '',
        outputFile: typeof raw.outputFile === 'string' ? raw.outputFile : '',
        outputPath: typeof raw.outputPath === 'string' ? raw.outputPath : '',
        downloadedAt: typeof raw.downloadedAt === 'string' ? raw.downloadedAt : '',
        info: raw.info ?? null
      }
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to read sidecar metadata'
    }
  }
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

  safeSetHandler('settings:get', async (_, key: SettingKey) => {
    return getSetting(key)
  })

  safeSetHandler('settings:get-many', async (_, keys: SettingKey[]) => {
    return getSettings(keys)
  })

  safeSetHandler('settings:set', async (_, payload: { key: SettingKey; value: unknown }) => {
    return setSetting(payload.key, payload.value)
  })

  safeSetHandler('download-player', async (_, payload: { id: string }) => {
    if (!payload?.id) return { success: false, message: 'Job not found' }

    const job = downloadsQueue.getJob(payload.id)
    if (!job) return { success: false, message: 'Job not found' }
    if (job.status !== 'completed') {
      return { success: false, message: 'Only completed media can be played' }
    }

    const filePath = job.finalFilePath ?? job.outputFile
    if (!filePath) return { success: false, message: 'Output file path not found' }
    return openPlayerWindow(mainWindow, filePath)
  })

  safeSetHandler('download-player-file', async (_, filePath: string) => {
    try {
      if (typeof filePath !== 'string' || filePath.trim().length === 0) {
        return { success: false, message: 'Invalid path' }
      }

      return await openPlayerWindow(mainWindow, filePath)
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to open player'
      }
    }
  })

  safeSetHandler('download-dir-open', async () => {
    try {
      const downloadDir = getDownloadDir()
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

  safeSetHandler('downloads-root-open', async () => {
    try {
      const result = await shell.openPath(getDownloadsRootDir())
      if (result) {
        return { success: false, message: result || 'Failed to open downloads root directory' }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to open downloads root directory'
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

  safeSetHandler('media-sidecar-read', async (_, filePath: string) => readMediaSidecar(filePath))

  safeSetHandler('download-video', async (_, url: string) => {
    if (downloadsQueue.hasUrl(url)) {
      return { success: false, message: 'Already downloading' }
    }

    const downloadDir = getDownloadDir()
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

    const downloadDir = getDownloadDir()
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

      const downloadDir = getDownloadDir()

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

  safeSetHandler('library-list', async () => {
    return listLibraryItems(getDownloadDir())
  })

  safeSetHandler('library-delete', async (_, filePath: string) => {
    try {
      await deleteLibraryItem(getDownloadDir(), filePath)
      return { success: true }
    } catch (error) {
      log.error('Error deleting library item:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete file'
      }
    }
  })

  safeSetHandler('downloads-start', async () => {
    downloadsQueue.start()
    return { success: true }
  })

  safeSetHandler('downloads-pause', async () => {
    await downloadsQueue.pause()
    return { success: true }
  })
}
