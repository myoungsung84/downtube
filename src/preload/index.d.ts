/// <reference types="vite/client" />

import type { DownloadJob, DownloadQueueEvent } from '@src/types/download.types'
import type { InitState } from '@src/types/init.types'

interface AppAPI {
  playVideo: (url: string) => Promise<void>
  openDownloadDir: () => Promise<void>

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

  onDownloadsEvent: (callback: (ev: DownloadQueueEvent) => void) => () => void

  initApp: () => Promise<InitState>
  onInitState: (callback: (state: InitState) => void) => () => void
}

declare global {
  interface Window {
    api: AppAPI
  }
}

export {}
