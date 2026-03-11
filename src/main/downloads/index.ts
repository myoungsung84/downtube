import { DownloadQueue } from './application/download-queue'
import type { DownloadQueueEvent } from './types'

type Listener = (ev: DownloadQueueEvent) => void

const listeners = new Set<Listener>()

export const downloadsQueue = new DownloadQueue((ev) => {
  for (const fn of listeners) fn(ev)
})

export function onDownloadsEvent(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export { hasRunningTask } from './application/run-download-job'
export { isDownloadStoppedError, runDownloadJob } from './application/run-download-job'
export { stopCurrentJobAndCleanup } from './application/stop-download-job'
export type { DownloadInfo, DownloadJob, DownloadJobStatus, DownloadQueueEvent } from './types'
