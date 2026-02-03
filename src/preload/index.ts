import { contextBridge, ipcRenderer } from 'electron'

import type { DownloadJob, DownloadQueueEvent } from '../types/download.types'

const api = {
  playVideo: (url: string) => ipcRenderer.invoke('download-player', url),
  openDownloadDir: () => ipcRenderer.invoke('download-dir-open'),
  downloadInfo: (url: string) => ipcRenderer.invoke('download-info', url),

  // ---------------------------
  // queue controls (Start / Pause)
  // ---------------------------
  downloadsStart: () => ipcRenderer.invoke('downloads-start'),
  downloadsPause: () => ipcRenderer.invoke('downloads-pause'),

  // ---------------------------
  // 다운로드 요청
  // ---------------------------
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

  stopDownload: (url: string) => ipcRenderer.invoke('download-stop', url),

  // ---------------------------
  // 기존 이벤트 (호환 유지)
  // ---------------------------
  onDownloadProgress: (
    callback: (data: {
      url: string
      current: 'video' | 'audio' | 'complete' | 'init' | null
      percent: number
    }) => void
  ) => {
    const handler = (
      _: unknown,
      data: {
        url: string
        current: 'video' | 'audio' | 'complete' | 'init' | null
        percent: number
      }
    ): void => callback(data)

    ipcRenderer.on('download-progress', handler)
    return () => ipcRenderer.removeListener('download-progress', handler)
  },

  onDownloadDone: (callback: (data: { url: string; file?: string }) => void) => {
    const handler = (_: unknown, data: { url: string; file?: string }): void => callback(data)
    ipcRenderer.on('download-done', handler)
    return () => ipcRenderer.removeListener('download-done', handler)
  },

  // ---------------------------
  // 신규: job 기반 이벤트
  // ---------------------------
  onDownloadsEvent: (callback: (ev: DownloadQueueEvent) => void) => {
    const handler = (_: unknown, ev: DownloadQueueEvent): void => callback(ev)
    ipcRenderer.on('downloads:event', handler)
    return () => ipcRenderer.removeListener('downloads:event', handler)
  },

  resolveAssetPath: (filename: string): Promise<string> => {
    return ipcRenderer.invoke('resolve-asset-path', filename)
  }
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api)
} else {
  // @ts-ignore -- legacy preload fallback
  window.api = api
}
