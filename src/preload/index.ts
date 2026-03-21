import { contextBridge, ipcRenderer } from 'electron'

import type { DownloadJob, DownloadQueueEvent } from '../types/download.types'
import type { InitState } from '../types/init.types'
import type { ListLibraryItemsResult } from '../types/library.types'
import type { ReadMediaSidecarResult } from '../types/media-sidecar.types'
import type { PlayerOpenPayload } from '../types/player.types'
import type {
  AppLanguage,
  AppLanguagePreference,
  SettingKey,
  SettingValueMap
} from '../types/settings.types'

const api = {
  openPlayer: (payload: PlayerOpenPayload) => ipcRenderer.invoke('player-open', payload),
  openDownloadDir: () => ipcRenderer.invoke('download-dir-open'),
  openDownloadsRootDir: () => ipcRenderer.invoke('downloads-root-open'),
  openDownloadItem: (path: string) => ipcRenderer.invoke('download-item-open', path),
  fileExists: (path: string): Promise<boolean> => ipcRenderer.invoke('file-exists', path),
  readMediaSidecar: (path: string): Promise<ReadMediaSidecarResult> =>
    ipcRenderer.invoke('media-sidecar-read', path),

  downloadsStart: () => ipcRenderer.invoke('downloads-start'),
  downloadsPause: () => ipcRenderer.invoke('downloads-pause'),

  download: (url: string) => ipcRenderer.invoke('download-video', url),
  downloadAudio: (url: string) => ipcRenderer.invoke('download-audio', url),

  downloadPlaylist: (payload: {
    url: string
    type: 'video' | 'audio'
    playlistLimit?: number
    filenamePrefix?: string
  }) => ipcRenderer.invoke('download-playlist', payload),

  setDownloadType: (payload: { id: string; type: 'video' | 'audio' }) =>
    ipcRenderer.invoke('download-set-type', payload),

  listDownloads: (): Promise<DownloadJob[]> => ipcRenderer.invoke('downloads-list'),
  listLibraryItems: (): Promise<ListLibraryItemsResult> => ipcRenderer.invoke('library-list'),
  deleteLibraryItem: (filePath: string) => ipcRenderer.invoke('library-delete', filePath),

  stopDownload: (url: string) => ipcRenderer.invoke('download-stop', url),

  removeDownload: (jobId: string) => ipcRenderer.invoke('download-remove', { id: jobId }),

  onDownloadsEvent: (callback: (ev: DownloadQueueEvent) => void) => {
    const handler = (_: unknown, ev: DownloadQueueEvent): void => callback(ev)
    ipcRenderer.on('downloads:event', handler)
    return () => ipcRenderer.removeListener('downloads:event', handler)
  },

  initApp: (): Promise<InitState> => ipcRenderer.invoke('app:init'),

  onInitState: (callback: (state: InitState) => void) => {
    const handler = (_: unknown, state: InitState): void => callback(state)
    ipcRenderer.on('app:init-state', handler)
    return () => ipcRenderer.removeListener('app:init-state', handler)
  },

  getSetting: <K extends SettingKey>(key: K): Promise<SettingValueMap[K]> =>
    ipcRenderer.invoke('settings:get', key),

  getSettings: <const K extends readonly SettingKey[]>(
    keys: K
  ): Promise<Pick<SettingValueMap, K[number]>> => ipcRenderer.invoke('settings:get-many', keys),
  resolveAppLanguage: (preference?: AppLanguagePreference): Promise<AppLanguage> =>
    ipcRenderer.invoke('settings:resolve-language', preference),

  setSetting: <K extends SettingKey>(
    key: K,
    value: SettingValueMap[K]
  ): Promise<SettingValueMap[K]> => ipcRenderer.invoke('settings:set', { key, value })
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api)
} else {
  // @ts-ignore -- legacy preload fallback
  window.api = api
}
