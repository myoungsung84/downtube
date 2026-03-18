import type { DownloadInfo, DownloadJob } from './download.types'

export type MediaSidecarData = {
  id: string
  url: string
  type: DownloadJob['type']
  filename: string
  outputFile: string
  outputPath: string
  downloadedAt: string
  info: DownloadInfo | null
}

export type ReadMediaSidecarResult = {
  success: boolean
  title?: string
  artist?: string
  thumbnailPath?: string
  info?: DownloadInfo | null
  sidecar?: MediaSidecarData
  message?: string
}
