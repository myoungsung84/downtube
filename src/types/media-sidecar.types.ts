import type { DownloadInfo, DownloadJob } from './download.types'
import type { AppResult } from './error.types'

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

export type ReadMediaSidecarData = {
  success: boolean
  title?: string
  artist?: string
  thumbnailPath?: string
  info?: DownloadInfo | null
  sidecar?: MediaSidecarData
}

export type ReadMediaSidecarResult = AppResult<Omit<ReadMediaSidecarData, 'success'>>
