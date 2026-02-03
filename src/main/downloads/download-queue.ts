import { randomUUID } from 'crypto'

import type { DownloadJob, DownloadQueueEvent } from '../../types/download.types'
import { parsePlaylistItems } from './yt-dlp-playlist'
import { isDownloadStoppedError, runDownloadJob, stopCurrentJobAndCleanup } from './yt-dlp-runner'

export class DownloadQueue {
  private jobs: DownloadJob[] = []
  private running = false

  // ✅ 기본: 자동 시작 금지
  private paused = true

  constructor(private emit: (ev: DownloadQueueEvent) => void) {}

  getJobs(): DownloadJob[] {
    return this.jobs
  }

  hasUrl(url: string): boolean {
    return this.jobs.some((j) => j.url === url && (j.status === 'queued' || j.status === 'running'))
  }

  private emitQueueState(currentJobId?: string): void {
    this.emit({
      type: 'queue-state',
      running: this.running,
      paused: this.paused,
      currentJobId
    })
  }

  /**
   * ✅ 큐 시작/재개 (Resume)
   * - paused 해제 후 process 돌림
   */
  start(): void {
    this.paused = false

    this.emitQueueState(this.currentRunningJobId())
    this.process()
  }

  /**
   * ✅ 큐 일시정지 (Pause)
   * - 현재 running job은 그대로 두고,
   *   다음 job부터는 실행되지 않음
   */
  /**
   * ✅ 큐 일시정지 (Pause)
   * - 현재 running job도 중단(kill)해서 "진짜 pause"처럼 동작
   */
  async pause(): Promise<void> {
    this.paused = true

    const runningJob = this.jobs.find((j) => j.status === 'running')
    if (runningJob) {
      // 1) UI에 "중단 중" 느낌을 주고 싶으면 여기서 상태 먼저 쏴도 됨
      // this.emitQueueState(runningJob.id)

      // 2) 실제 프로세스 중단 + 임시파일/핸들 정리
      await stopCurrentJobAndCleanup(runningJob)

      // 3) resume 시 다시 받을 수 있게 queued로 되돌림 (추천)
      //    (취소랑 구분되게 하려면 error는 지우고 progress는 유지/리셋 선택)
      this.update(runningJob.id, {
        status: 'queued',
        // 진행률 유지하고 싶으면 그대로 두고,
        // 처음부터 다시 받고 싶으면 아래처럼 리셋
        // progress: { percent: 0, current: null },
        startedAt: undefined
      })
    }

    this.emitQueueState(this.currentRunningJobId())
  }

  /**
   * (옵션) UI에서 필요하면 현재 paused 상태를 확인
   */
  isPaused(): boolean {
    return this.paused
  }

  enqueue(job: DownloadJob): void {
    this.jobs.push(job)
    this.emit({ type: 'job-added', job })

    // 상태만 한번 알려줌(선택)
    this.emitQueueState(this.currentRunningJobId())
  }

  /**
   * ✅ 리스트 아이템에서 오디오/비디오 변경용
   * - queued 상태에서만 변경 가능
   */
  setType(jobId: string, type: DownloadJob['type']): { success: boolean; message?: string } {
    const job = this.jobs.find((j) => j.id === jobId)
    if (!job) return { success: false, message: 'Job not found' }

    if (job.status !== 'queued') {
      return { success: false, message: 'Only queued job can change type' }
    }

    job.type = type
    this.emit({ type: 'job-updated', job })
    return { success: true }
  }

  /**
   * ✅ playlist URL -> 아이템별로 job 생성해서 enqueue
   * - playlistLimit으로 과다운로드 방지
   */
  async enqueuePlaylist(args: {
    playlistUrl: string
    type: DownloadJob['type']
    outputDir: string
    filenamePrefix: string
    playlistLimit: number
  }): Promise<{ added: number; limited: boolean }> {
    const { playlistUrl, type, outputDir, filenamePrefix, playlistLimit } = args

    const items = await parsePlaylistItems({ playlistUrl })
    const limitedItems = items.slice(0, playlistLimit)
    const limited = items.length > limitedItems.length

    let added = 0

    for (let i = 0; i < limitedItems.length; i++) {
      const item = limitedItems[i]
      if (!item.url) continue

      // 중복 방지(실행중/대기중만)
      if (this.hasUrl(item.url)) continue

      // filename은 runner가 baseName으로 쓰므로 여기서 고유하게 만들어줌
      const safeIndex = String(i + 1).padStart(3, '0')
      const baseName = `${filenamePrefix}_${safeIndex}`

      const job: DownloadJob = {
        id: randomUUID(),
        url: item.url,
        type,
        status: 'queued',
        filename: baseName,
        outputDir,
        progress: { percent: 0, current: null },
        createdAt: Date.now()
      }

      this.enqueue(job)
      added++
    }

    return { added, limited }
  }

  async cancelByUrl(url: string): Promise<{ success: boolean; message?: string }> {
    const job = this.jobs.find(
      (j) => j.url === url && (j.status === 'queued' || j.status === 'running')
    )
    if (!job) return { success: false, message: 'No download task found' }

    if (job.status === 'queued') {
      job.status = 'cancelled'
      this.emit({ type: 'job-updated', job })
      return { success: true }
    }

    if (job.status === 'running') {
      job.status = 'cancelled'
      this.emit({ type: 'job-updated', job })
      await stopCurrentJobAndCleanup(job)
      return { success: true }
    }

    return { success: false, message: 'Cannot cancel this job' }
  }

  private update(jobId: string, patch: Partial<DownloadJob>): void {
    const idx = this.jobs.findIndex((j) => j.id === jobId)
    if (idx < 0) return
    this.jobs[idx] = { ...this.jobs[idx], ...patch }
    this.emit({ type: 'job-updated', job: this.jobs[idx] })
  }

  private pickNext(): DownloadJob | null {
    return this.jobs.find((j) => j.status === 'queued') ?? null
  }

  private currentRunningJobId(): string | undefined {
    return this.jobs.find((j) => j.status === 'running')?.id
  }

  private async process(): Promise<void> {
    if (this.running) return
    if (this.paused) {
      // paused 상태도 UI가 확실히 알게끔 상태 emit (선택이지만 추천)
      this.emitQueueState(this.currentRunningJobId())
      return
    }

    const next = this.pickNext()
    if (!next) {
      this.emitQueueState(undefined)
      return
    }

    this.running = true
    this.emitQueueState(next.id)

    try {
      this.update(next.id, { status: 'running', startedAt: Date.now() })

      const result = await runDownloadJob(next, (p) => {
        if (next.status === 'cancelled') return
        const percent = p.percent ?? next.progress.percent
        this.update(next.id, { progress: { percent, current: p.current } })
      })

      if (next.status !== 'cancelled') {
        this.update(next.id, {
          status: 'completed',
          finishedAt: Date.now(),
          outputFile: result.outputFile,
          progress: { percent: 100, current: 'complete' }
        })
      }
    } catch (e) {
      if (isDownloadStoppedError(e)) {
        return
      }
      if (next.status !== 'cancelled') {
        this.update(next.id, { status: 'failed', finishedAt: Date.now(), error: String(e) })
      }
    } finally {
      this.running = false
      this.emitQueueState(this.currentRunningJobId())

      // ✅ paused가 아니면만 연쇄 실행
      if (!this.paused) {
        void this.process()
      }
    }
  }
}
