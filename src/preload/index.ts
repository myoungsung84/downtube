import { contextBridge, ipcRenderer } from 'electron'

import type { DownloadJob, DownloadQueueEvent } from '../types/download.types'
import type { InitState } from '../types/init.types'

const api = {
  playVideo: (url: string) => ipcRenderer.invoke('download-player', url),
  openDownloadDir: () => ipcRenderer.invoke('download-dir-open'),

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
  }
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api)
} else {
  // @ts-ignore -- legacy preload fallback
  window.api = api
}
