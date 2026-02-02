export type DownloadJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export type DownloadJob = {
  id: string
  url: string
  type: 'video' | 'audio'

  status: DownloadJobStatus

  filename: string
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
}

export type DownloadQueueEvent =
  | { type: 'job-added'; job: DownloadJob }
  | { type: 'job-updated'; job: DownloadJob }
  | { type: 'job-removed'; id: string }
  | { type: 'queue-state'; running: boolean; currentJobId?: string }
