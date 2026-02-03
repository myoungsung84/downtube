/// <reference types="vite/client" />

import type { DownloadJob, DownloadQueueEvent } from '@src/types/download.types'
import type { VideoInfo } from '@src/types/video-info.types'

interface AppAPI {
  playVideo: (url: string) => Promise<void>
  openDownloadDir: () => Promise<void>

  downloadInfo: (url: string) => Promise<VideoInfo>

  // ---------------------------
  // queue controls
  // ---------------------------
  downloadsStart: () => Promise<{ success: boolean; message?: string }>
  downloadsPause: () => Promise<{ success: boolean; message?: string }>

  // ---------------------------
  // downloads (enqueue)
  // ---------------------------
  download: (url: string) => Promise<{ success: boolean; message?: string }>
  downloadAudio: (url: string) => Promise<{ success: boolean; message?: string }>

  downloadPlaylist: (payload: {
    url: string
    type: 'video' | 'audio'
    playlistLimit?: number
    filenamePrefix?: string
  }) => Promise<{ success: boolean; added?: number; limited?: boolean; message?: string }>

  // ---------------------------
  // job controls
  // ---------------------------
  setDownloadType: (payload: { id: string; type: 'video' | 'audio' }) => Promise<{
    success: boolean
    message?: string
  }>

  stopDownload: (url: string) => Promise<{ success: boolean; message?: string }>

  // ---------------------------
  // list / events
  // ---------------------------
  listDownloads: () => Promise<DownloadJob[]>

  onDownloadsEvent: (callback: (ev: DownloadQueueEvent) => void) => () => void

  // 기존 이벤트 (호환)
  onDownloadProgress: (
    callback: (data: {
      url: string
      current: 'video' | 'audio' | 'complete' | 'init' | null
      percent: number
    }) => void
  ) => () => void

  onDownloadDone: (callback: (data: { url: string; file?: string }) => void) => () => void

  // ---------------------------
  // misc
  // ---------------------------
  resolveAssetPath: (filename: string) => Promise<string>
}

declare global {
  interface Window {
    api: AppAPI
  }
}

export {}
