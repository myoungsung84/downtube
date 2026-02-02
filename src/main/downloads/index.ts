import type { DownloadQueueEvent } from './download.types'
import { DownloadQueue } from './download-queue'

type Listener = (ev: DownloadQueueEvent) => void

const listeners = new Set<Listener>()

export const downloadsQueue = new DownloadQueue((ev) => {
  for (const fn of listeners) fn(ev)
})

export function onDownloadsEvent(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
