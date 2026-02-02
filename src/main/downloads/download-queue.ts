import type { DownloadJob, DownloadQueueEvent } from './download.types'
import { runDownloadJob, stopCurrentJobAndCleanup } from './yt-dlp-runner'

export class DownloadQueue {
  private jobs: DownloadJob[] = []
  private running = false

  constructor(private emit: (ev: DownloadQueueEvent) => void) {}

  getJobs(): DownloadJob[] {
    return this.jobs
  }

  hasUrl(url: string): boolean {
    return this.jobs.some((j) => j.url === url && (j.status === 'queued' || j.status === 'running'))
  }

  enqueue(job: DownloadJob): void {
    this.jobs.push(job)
    this.emit({ type: 'job-added', job })
    this.process()
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

  private async process(): Promise<void> {
    if (this.running) return

    const next = this.pickNext()
    if (!next) return

    this.running = true
    this.emit({ type: 'queue-state', running: true, currentJobId: next.id })

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
      if (next.status !== 'cancelled') {
        this.update(next.id, { status: 'failed', finishedAt: Date.now(), error: String(e) })
      }
    } finally {
      this.running = false
      this.emit({ type: 'queue-state', running: false })
      this.process()
    }
  }
}
