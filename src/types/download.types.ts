export type DownloadJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export type DownloadInfo = {
  id: string
  url: string
  title: string
  uploader?: string
  channel?: string
  thumbnail?: string
  duration?: number
  webpageUrl?: string
  extractor?: string
  isLive?: boolean
  availability?: string
  formatsCount?: number
}

export type DownloadJob = {
  id: string
  url: string

  type: 'video' | 'audio'

  status: DownloadJobStatus

  filename: string

  filenamePrefix?: string

  playlistIndex?: number

  outputDir: string
  outputFile?: string

  progress: {
    percent: number
    current: 'video' | 'audio' | 'complete' | 'init' | null
  }

  error?: string

  createdAt: number
  startedAt?: number
  finishedAt?: number

  info?: DownloadInfo
}

export type DownloadQueueEvent =
  | { type: 'job-added'; job: DownloadJob }
  | { type: 'job-updated'; job: DownloadJob }
  | { type: 'job-removed'; id: string }
  | { type: 'queue-state'; running: boolean; paused: boolean; currentJobId?: string }
