/// <reference types="vite/client" />

interface AppAPI {
  download: (url: string) => Promise<{ success: boolean }>
  onDownloadProgress: (callback: (data: { url: string; percent: number }) => void) => void
  onDownloadDone: (callback: (data: { url: string }) => void) => void
}
