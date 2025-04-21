import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  download: (url: string) => ipcRenderer.invoke('download-video', url),
  onDownloadProgress: (callback: (data: { url: string; percent: number }) => void) => {
    ipcRenderer.on('download-progress', (_event, data) => {
      callback(data)
    })
  },
  onDownloadDone: (callback: (data: { url: string }) => void) => {
    ipcRenderer.on('download-done', (_event, data) => {
      callback(data)
    })
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
