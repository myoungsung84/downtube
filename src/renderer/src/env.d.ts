/// <reference types="vite/client" />

interface AppAPI {
  openDownloadDir: () => Promise<void>
  downloadInfo: (url: string) => Promise<VideoInfo>
  download: (url: string) => Promise<{ success: boolean }>
  stopDownload: (url: string) => Promise<boolean>
  onDownloadProgress: (
    callback: (data: {
      url: string
      current: 'video' | 'audio' | 'complete' | 'init' | null
      percent: number
    }) => void
  ) => void
  onDownloadDone: (callback: (data: { url: string }) => void) => void
}
