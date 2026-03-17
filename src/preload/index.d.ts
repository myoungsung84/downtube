/// <reference types="vite/client" />

import type { DownloadJob, DownloadQueueEvent } from '@src/types/download.types'
import type { InitState } from '@src/types/init.types'
import type { LibraryItem } from '@src/types/library.types'
import type { SettingKey, SettingValueMap } from '@src/types/settings.types'

interface AppAPI {
  openPlayer: (payload: { id: string }) => Promise<{ success: boolean; message?: string }>
  openPlayerFile: (filePath: string) => Promise<{ success: boolean; message?: string }>
  openDownloadDir: () => Promise<{ success: boolean; message?: string }>
  openDownloadsRootDir: () => Promise<{ success: boolean; message?: string }>
  openDownloadItem: (path: string) => Promise<{ success: boolean; message?: string }>
  readMediaMeta: (path: string) => Promise<{
    success: boolean
    title?: string
    artist?: string
    message?: string
  }>

  downloadsStart: () => Promise<{ success: boolean; message?: string }>
  downloadsPause: () => Promise<{ success: boolean; message?: string }>

  download: (url: string) => Promise<{ success: boolean; message?: string }>
  downloadAudio: (url: string) => Promise<{ success: boolean; message?: string }>

  downloadPlaylist: (payload: {
    url: string
    type: 'video' | 'audio'
    playlistLimit?: number
    filenamePrefix?: string
  }) => Promise<{ success: boolean; added?: number; limited?: boolean; message?: string }>

  setDownloadType: (payload: { id: string; type: 'video' | 'audio' }) => Promise<{
    success: boolean
    message?: string
  }>

  stopDownload: (url: string) => Promise<{ success: boolean; message?: string }>

  removeDownload: (jobId: string) => Promise<{ success: boolean; message?: string }>

  listDownloads: () => Promise<DownloadJob[]>
  listLibraryItems: () => Promise<LibraryItem[]>
  deleteLibraryItem: (filePath: string) => Promise<{ success: boolean; message?: string }>

  onDownloadsEvent: (callback: (ev: DownloadQueueEvent) => void) => () => void

  initApp: () => Promise<InitState>
  onInitState: (callback: (state: InitState) => void) => () => void

  getSetting: <K extends SettingKey>(key: K) => Promise<SettingValueMap[K]>
  getSettings: <const K extends readonly SettingKey[]>(
    keys: K
  ) => Promise<Pick<SettingValueMap, K[number]>>
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
