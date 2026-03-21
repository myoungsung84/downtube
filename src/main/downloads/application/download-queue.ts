import { randomUUID } from 'crypto'

import type { AppResult } from '../../../types/error.types'
import { failureResult, successResult } from '../../common/app-error'
import { parsePlaylistInfos } from '../adapters/yt-dlp/yt-dlp-playlist'
import type { DownloadJob, DownloadQueueEvent } from '../types'
import { normalizeDownloadsError } from './downloads-error'
import { isDownloadStoppedError, runDownloadJob } from './run-download-job'
import { stopCurrentJobAndCleanup } from './stop-download-job'

export class DownloadQueue {
  private jobs: DownloadJob[] = []
  private running = false

  private paused = true

  constructor(private emit: (ev: DownloadQueueEvent) => void) {}

  getJobs(): DownloadJob[] {
    return this.jobs
  }

  getJob(id: string): DownloadJob | undefined {
    return this.jobs.find((j) => j.id === id)
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

  start(): void {
    this.paused = false

    this.emitQueueState(this.currentRunningJobId())
    this.process()
  }

  async pause(): Promise<void> {
    this.paused = true

    const runningJob = this.jobs.find((j) => j.status === 'running')
    if (runningJob) {
      await stopCurrentJobAndCleanup(runningJob)
      this.update(runningJob.id, {
        status: 'queued',
        startedAt: undefined
      })
    }

    this.emitQueueState(this.currentRunningJobId())
  }

  isPaused(): boolean {
    return this.paused
  }

  enqueue(job: DownloadJob): void {
    this.jobs.push(job)
    this.emit({ type: 'job-added', job })

    this.emitQueueState(this.currentRunningJobId())
  }

  setType(jobId: string, type: DownloadJob['type']): AppResult {
    const job = this.jobs.find((j) => j.id === jobId)
    if (!job) return failureResult('common.not_found')

    if (job.status !== 'queued') {
      return failureResult('common.invalid_request')
    }

    job.type = type
    this.emit({ type: 'job-updated', job })
    return successResult()
  }

  async enqueuePlaylist(args: {
    playlistUrl: string
    type: DownloadJob['type']
    outputDir: string
    filenamePrefix: string
    playlistLimit: number
  }): Promise<{ added: number; limited: boolean }> {
    const { playlistUrl, type, outputDir, filenamePrefix, playlistLimit } = args

    const items = await parsePlaylistInfos({ playlistUrl, playlistLimit })
    const limitedItems = items.slice(0, playlistLimit)
    const limited = items.length > limitedItems.length

    let added = 0

    for (let i = 0; i < limitedItems.length; i++) {
      const item = limitedItems[i]
      if (!item.url) continue

      if (this.hasUrl(item.url)) continue

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
        createdAt: Date.now(),
        info: item
      }

      this.enqueue(job)
      added++
    }

    return { added, limited }
  }

  async cancelByUrl(url: string): Promise<AppResult> {
    const job = this.jobs.find(
      (j) => j.url === url && (j.status === 'queued' || j.status === 'running')
    )
    if (!job) return failureResult('common.not_found')

    if (job.status === 'queued') {
      job.status = 'cancelled'
      this.emit({ type: 'job-updated', job })
      return successResult()
    }

    if (job.status === 'running') {
      job.status = 'cancelled'
      this.emit({ type: 'job-updated', job })
      await stopCurrentJobAndCleanup(job)
      return successResult()
    }

    return failureResult('common.invalid_request')
  }

  remove(id: string): AppResult {
    const job = this.jobs.find((j) => j.id === id)
    if (!job) return failureResult('common.not_found')

    if (job.status === 'running') {
      return failureResult('common.invalid_request')
    }

    this.jobs = this.jobs.filter((j) => j.id !== id)
    this.emit({ type: 'job-removed', id })

    this.emitQueueState(this.currentRunningJobId())

    return successResult()
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
          finalFilePath: result.outputFile,
          outputFile: result.outputFile,
          progress: { percent: 100, current: 'complete' }
        })
      }
    } catch (e) {
      if (isDownloadStoppedError(e)) {
        return
      }
      if (next.status !== 'cancelled') {
        this.update(next.id, {
          status: 'failed',
          finishedAt: Date.now(),
          error: normalizeDownloadsError(e)
        })
      }
    } finally {
      this.running = false
      this.emitQueueState(this.currentRunningJobId())

      if (!this.paused) {
        void this.process()
      }
    }
  }
}
