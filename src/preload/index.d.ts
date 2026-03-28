/// <reference types="vite/client" />

import type { AppRuntimeInfo } from '@src/types/app.types'
import type { DownloadJob, DownloadQueueEvent } from '@src/types/download.types'
import type { AppResult } from '@src/types/error.types'
import type { InitState } from '@src/types/init.types'
import type { ListLibraryItemsResult } from '@src/types/library.types'
import type { ReadMediaSidecarResult } from '@src/types/media-sidecar.types'
import type { PlayerOpenPayload } from '@src/types/player.types'
import type {
  AppLanguage,
  AppLanguagePreference,
  SettingKey,
  SettingValueMap
} from '@src/types/settings.types'
import type {
  ApplyUpdateResult,
  AppUpdateEvent,
  CheckForUpdatesResult,
  DownloadUpdateResult,
  PreparedUpdateCache
} from '@src/types/update.types'

interface AppAPI {
  openPlayer: (payload: PlayerOpenPayload) => Promise<AppResult>
  openDownloadDir: () => Promise<AppResult>
  openDownloadsRootDir: () => Promise<AppResult>
  openDownloadItem: (path: string) => Promise<AppResult>
  fileExists: (path: string) => Promise<boolean>
  readMediaSidecar: (path: string) => Promise<ReadMediaSidecarResult>

  downloadsStart: () => Promise<AppResult>
  downloadsPause: () => Promise<AppResult>

  download: (url: string) => Promise<AppResult>
  downloadAudio: (url: string) => Promise<AppResult>

  downloadPlaylist: (payload: {
    url: string
    type: 'video' | 'audio'
    playlistLimit?: number
    filenamePrefix?: string
  }) => Promise<AppResult<{ added: number; limited: boolean }>>

  setDownloadType: (payload: { id: string; type: 'video' | 'audio' }) => Promise<AppResult>

  stopDownload: (url: string) => Promise<AppResult>

  removeDownload: (jobId: string) => Promise<AppResult>

  listDownloads: () => Promise<DownloadJob[]>
  listLibraryItems: () => Promise<ListLibraryItemsResult>
  deleteLibraryItem: (filePath: string) => Promise<AppResult>

  onDownloadsEvent: (callback: (ev: DownloadQueueEvent) => void) => () => void

  initApp: () => Promise<InitState>
  getRuntimeInfo: () => Promise<AppRuntimeInfo>
  getPreparedUpdate: () => Promise<PreparedUpdateCache | null>
  checkForUpdates: () => Promise<AppResult<CheckForUpdatesResult>>
  downloadUpdate: () => Promise<AppResult<DownloadUpdateResult>>
  applyUpdate: () => Promise<AppResult<ApplyUpdateResult>>
  onInitState: (callback: (state: InitState) => void) => () => void
  onAppUpdateEvent: (callback: (event: AppUpdateEvent) => void) => () => void

  getSetting: <K extends SettingKey>(key: K) => Promise<SettingValueMap[K]>
  getSettings: <const K extends readonly SettingKey[]>(
    keys: K
  ) => Promise<Pick<SettingValueMap, K[number]>>
  resolveAppLanguage: (preference?: AppLanguagePreference) => Promise<AppLanguage>
  setSetting: <K extends SettingKey>(
    key: K,
    value: SettingValueMap[K]
  ) => Promise<SettingValueMap[K]>
}

declare global {
  interface Window {
    api: AppAPI
  }
}

export {}
