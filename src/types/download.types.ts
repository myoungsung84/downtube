export type DownloadJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export type DownloadJob = {
  id: string
  url: string

  /**
   * 다운로드 타입 (리스트 아이템에서 토글되는 값)
   * - queued 상태에서만 변경 가능하도록 queue에서 제어
   */
  type: 'video' | 'audio'

  status: DownloadJobStatus

  /**
   * 파일명(확장자 제외)
   * - ✅ process()에서 확정할 예정이므로 enqueue 시점에는 '' 가능
   */
  filename: string

  /**
   * ✅ 파일명 규칙용 prefix
   * - playlist: {timestamp}
   * - single:   {timestamp}
   * - 없으면 createdAt 기반으로 fallback
   */
  filenamePrefix?: string

  /**
   * ✅ playlist에서의 고정 순서(1..n)
   * - playlist가 아니면 undefined
   */
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
}

export type DownloadQueueEvent =
  | { type: 'job-added'; job: DownloadJob }
  | { type: 'job-updated'; job: DownloadJob }
  | { type: 'job-removed'; id: string }
  | { type: 'queue-state'; running: boolean; paused: boolean; currentJobId?: string }
