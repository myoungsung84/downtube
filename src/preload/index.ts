import { contextBridge, ipcRenderer } from 'electron'

const api = {
  playVideo: (url: string) => ipcRenderer.invoke('download-player', url),
  openDownloadDir: () => ipcRenderer.invoke('download-dir-open'),
  downloadInfo: (url: string) => ipcRenderer.invoke('download-info', url),
  download: (url: string) => ipcRenderer.invoke('download-video', url),
  stopDownload: (url: string) => ipcRenderer.invoke('download-stop', url),

  onDownloadProgress: (
    callback: (data: {
      url: string
      current: 'video' | 'audio' | 'complete' | 'init' | null
      percent: number
    }) => void
  ) => {
    ipcRenderer.on('download-progress', (_event, data) => {
      callback(data)
    })
  },

  onDownloadDone: (callback: (data: { url: string }) => void) => {
    ipcRenderer.on('download-done', (_event, data) => {
      callback(data)
    })
  },

  resolveAssetPath: (filename: string): Promise<string> => {
    return ipcRenderer.invoke('resolve-asset-path', filename)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
