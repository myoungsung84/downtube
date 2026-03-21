import { app, BrowserWindow, ipcMain, screen, shell } from 'electron'
import log from 'electron-log'
import fs, { mkdirSync } from 'fs'
import path from 'path'
import url from 'url'

import type { AppResult } from '../../types/error.types'
import type { InitState } from '../../types/init.types'
import type { ListLibraryItemsResult } from '../../types/library.types'
import type { MediaSidecarData, ReadMediaSidecarResult } from '../../types/media-sidecar.types'
import type { PlayerOpenPayload } from '../../types/player.types'
import type { AppLanguagePreference, SettingKey } from '../../types/settings.types'
import {
  failureFromUnknown,
  failureResult,
  normalizeUnknownAppError,
  successResult
} from '../common/app-error'
import { initializeApp } from '../common/initialize-app'
import { downloadsQueue, onDownloadsEvent } from '../downloads'
import { downloadInfo } from '../downloads/adapters/yt-dlp/yt-dlp-info'
import { normalizeDownloadsError } from '../downloads/application/downloads-error'
import type { DownloadJob } from '../downloads/types'
import { deleteLibraryItem, listLibraryItems } from '../library/library'
import {
  getSetting,
  getSettings,
  resolveSettingsLanguage,
  setSetting
} from '../settings/settings-store'

const registeredHandlers = new Set<string>()
let playerWindow: BrowserWindow | null = null
let playerOpenInFlight = false
let initState: InitState = { status: 'idle' }
let initInFlight: Promise<InitState> | null = null
const SIDECAR_THUMBNAIL_EXTENSIONS = ['.jpg', '.png', '.webp'] as const
const PLAYER_SIZE_DEFAULT = { width: 1280, height: 720 } as const
const PLAYER_MIN_WIDTH = 900
const PLAYER_MIN_HEIGHT = 506
const PLAYER_WINDOW_MARGIN = 80

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

function isPathInsideDownloadDir(filePath: string): boolean {
  const resolvedRoot = path.resolve(getDownloadDir())
  const resolvedTarget = path.resolve(filePath)
  const normalizedRoot = process.platform === 'win32' ? resolvedRoot.toLowerCase() : resolvedRoot
  const normalizedTarget =
    process.platform === 'win32' ? resolvedTarget.toLowerCase() : resolvedTarget
  const rel = path.relative(normalizedRoot, normalizedTarget)
  return !rel.startsWith('..') && !path.isAbsolute(rel)
}

function parsePlayerPaths(payload: PlayerOpenPayload): string[] | null {
  if (!payload || !Array.isArray(payload.paths)) {
    return null
  }

  const normalizedPaths = payload.paths
    .filter((candidate): candidate is string => typeof candidate === 'string')
    .map((candidate) => candidate.trim())
    .filter((candidate) => candidate.length > 0)

  if (normalizedPaths.length === 0) {
    return null
  }

  if (!normalizedPaths.every((candidate) => isPathInsideDownloadDir(candidate))) {
    return null
  }

  return normalizedPaths
}

async function openPlayerWindow(
  mainWindow: BrowserWindow,
  payload: PlayerOpenPayload
): Promise<AppResult> {
  const paths = parsePlayerPaths(payload)
  if (!paths) {
    return failureResult('common.invalid_request')
  }

  const existingPaths = paths.filter((p) => fs.existsSync(p))
  if (existingPaths.length === 0) {
    return failureResult('common.file_not_found')
  }

  if (playerWindow && !playerWindow.isDestroyed()) {
    playerWindow.close()
  }

  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  const { width: waWidth, height: waHeight } = display.workArea
  const availableWidth = waWidth - PLAYER_WINDOW_MARGIN
  const availableHeight = waHeight - PLAYER_WINDOW_MARGIN
  const initWidth = Math.min(PLAYER_SIZE_DEFAULT.width, availableWidth)
  const initHeight = Math.min(PLAYER_SIZE_DEFAULT.height, availableHeight)

  playerWindow = new BrowserWindow({
    width: initWidth,
    height: initHeight,
    minWidth: Math.min(PLAYER_MIN_WIDTH, availableWidth),
    minHeight: Math.min(PLAYER_MIN_HEIGHT, availableHeight),
    useContentSize: true,
    show: false,
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true
    }
  })

  const devPort = mainWindow?.webContents.getURL().match(/localhost:(\d+)/)?.[1] ?? '5173'
  const playerHash = `/player?${new URLSearchParams({ paths: JSON.stringify(existingPaths) }).toString()}`
  const playerUrl = !app.isPackaged
    ? `http://localhost:${devPort}/#${playerHash}`
    : url.format({
        pathname: path.join(__dirname, '../renderer/index.html'),
        protocol: 'file:',
        slashes: true,
        hash: playerHash
      })

  const win = playerWindow
  win.once('ready-to-show', () => {
    if (!win.isDestroyed()) win.show()
  })

  await playerWindow.loadURL(playerUrl)

  if (!app.isPackaged) {
    playerWindow.webContents.openDevTools({ mode: 'detach' })
  }

  return successResult()
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

async function readMediaSidecar(filePath: string): Promise<ReadMediaSidecarResult> {
  if (typeof filePath !== 'string' || filePath.trim().length === 0) {
    return failureResult('common.invalid_request')
  }

  if (!isPathInsideDownloadDir(filePath)) {
    return failureResult('common.access_denied')
  }

  if (!fs.existsSync(filePath)) {
    return failureResult('common.file_not_found')
  }

  const jsonPath = `${getSidecarBasePath(filePath)}.json`
  if (!fs.existsSync(jsonPath)) {
    return failureResult('common.file_not_found')
  }

  try {
    const raw = JSON.parse(
      await fs.promises.readFile(jsonPath, 'utf-8')
    ) as Partial<MediaSidecarData>
    const title =
      typeof raw.info?.title === 'string' ? raw.info.title.trim() || undefined : undefined
    const artist =
      typeof raw.info?.uploader === 'string'
        ? raw.info.uploader.trim() || undefined
        : typeof raw.info?.channel === 'string'
          ? raw.info.channel.trim() || undefined
          : undefined

    return successResult({
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
    })
  } catch (error) {
    return failureFromUnknown('common.unknown', error)
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  if (typeof filePath !== 'string' || filePath.trim().length === 0) {
    return false
  }

  if (!isPathInsideDownloadDir(filePath)) {
    return false
  }

  try {
    await fs.promises.access(filePath, fs.constants.F_OK)
    return true
  } catch {
    return false
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
        const state: InitState = {
          status: 'error',
          error: normalizeUnknownAppError('init.initialization_failed', error)
        }
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

  safeSetHandler('settings:resolve-language', async (_, preference?: AppLanguagePreference) => {
    return resolveSettingsLanguage(preference)
  })

  safeSetHandler('player-open', async (_, payload: PlayerOpenPayload) => {
    if (playerOpenInFlight) {
      return successResult()
    }

    playerOpenInFlight = true

    try {
      return await openPlayerWindow(mainWindow, payload)
    } catch (error) {
      return failureFromUnknown('player.open_failed', error)
    } finally {
      playerOpenInFlight = false
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
        return failureResult('common.open_failed', result)
      }

      return successResult()
    } catch (error) {
      return failureFromUnknown('common.open_failed', error)
    }
  })

  safeSetHandler('downloads-root-open', async () => {
    try {
      const result = await shell.openPath(getDownloadsRootDir())
      if (result) {
        return failureResult('common.open_failed', result)
      }

      return successResult()
    } catch (error) {
      return failureFromUnknown('common.open_failed', error)
    }
  })

  safeSetHandler('download-item-open', async (_, filePath: string) => {
    try {
      if (typeof filePath !== 'string' || filePath.trim().length === 0) {
        return failureResult('common.invalid_request')
      }

      shell.showItemInFolder(filePath)
      return successResult()
    } catch (error) {
      return failureFromUnknown('common.open_failed', error)
    }
  })

  safeSetHandler('file-exists', async (_, filePath: string) => fileExists(filePath))

  safeSetHandler('media-sidecar-read', async (_, filePath: string) => readMediaSidecar(filePath))

  safeSetHandler('download-video', async (_, url: string) => {
    const normalizedUrl = typeof url === 'string' ? url.trim() : ''
    if (!normalizedUrl) {
      return failureResult('downloads.invalid_url')
    }

    if (downloadsQueue.hasUrl(normalizedUrl)) {
      return failureResult('downloads.already_in_queue')
    }

    const downloadDir = getDownloadDir()
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const baseName = `${timestamp}_VOD`

    const info = await downloadInfo(normalizedUrl).catch(() => undefined)

    const job: DownloadJob = {
      id: `${timestamp}:${Math.random().toString(16).slice(2)}`,
      url: normalizedUrl,
      type: 'video',
      status: 'queued',
      filename: baseName,
      outputDir: downloadDir,
      progress: { percent: 0, current: null },
      createdAt: Date.now(),
      info: info
    }

    downloadsQueue.enqueue(job)
    return successResult()
  })

  safeSetHandler('download-audio', async (_, url: string) => {
    const normalizedUrl = typeof url === 'string' ? url.trim() : ''
    if (!normalizedUrl) {
      return failureResult('downloads.invalid_url')
    }

    if (downloadsQueue.hasUrl(normalizedUrl)) {
      return failureResult('downloads.already_in_queue')
    }

    const downloadDir = getDownloadDir()
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const baseName = `${timestamp}_AUD`

    const info = await downloadInfo(normalizedUrl).catch(() => undefined)

    const job: DownloadJob = {
      id: `${timestamp}:${Math.random().toString(16).slice(2)}`,
      url: normalizedUrl,
      type: 'audio',
      status: 'queued',
      filename: baseName,
      outputDir: downloadDir,
      progress: { percent: 0, current: null },
      createdAt: Date.now(),
      info: info
    }

    downloadsQueue.enqueue(job)
    return successResult()
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
      try {
        const playlistUrl = typeof payload?.url === 'string' ? payload.url.trim() : ''
        const type = payload?.type
        const playlistLimit = payload?.playlistLimit ?? 50

        if (!playlistUrl) {
          return failureResult('downloads.invalid_url')
        }

        if (type !== 'video' && type !== 'audio') {
          return failureResult('common.invalid_request')
        }

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

        return successResult(res)
      } catch (error) {
        return {
          success: false,
          error: normalizeDownloadsError(error)
        }
      }
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
      return failureFromUnknown('downloads.download_failed', error)
    }
  })

  safeSetHandler('download-remove', async (_, payload: { id: string }) => {
    try {
      const job = downloadsQueue.getJob(payload.id)
      if (!job) return failureResult('common.not_found')

      if (job.status === 'running') {
        return failureResult('common.invalid_request')
      }

      downloadsQueue.remove(payload.id)
      return successResult()
    } catch (error) {
      log.error('Error removing download job:', error)
      return failureFromUnknown('downloads.download_failed', error)
    }
  })

  safeSetHandler('downloads-list', async () => downloadsQueue.getJobs())

  safeSetHandler('library-list', async (): Promise<ListLibraryItemsResult> => {
    try {
      const items = await listLibraryItems(getDownloadDir())
      return successResult({ items })
    } catch (error) {
      log.error('Error listing library items:', error)
      return {
        success: false,
        error: normalizeUnknownAppError('common.unknown', error)
      }
    }
  })

  safeSetHandler('library-delete', async (_, filePath: string) => {
    try {
      await deleteLibraryItem(getDownloadDir(), filePath)
      return successResult()
    } catch (error) {
      log.error('Error deleting library item:', error)
      return failureFromUnknown('library.delete_failed', error)
    }
  })

  safeSetHandler('downloads-start', async () => {
    downloadsQueue.start()
    return successResult()
  })

  safeSetHandler('downloads-pause', async () => {
    await downloadsQueue.pause()
    return successResult()
  })
}
