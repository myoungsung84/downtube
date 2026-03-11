import log from 'electron-log'

import type { DownloadJob } from '../types'

export function ctx(job: DownloadJob): string {
  return `[dl] id=${job.id.slice(0, 8)} type=${job.type} name=${job.filename}`
}

export async function step<T>(label: string, job: DownloadJob, fn: () => Promise<T>): Promise<T> {
  const t0 = Date.now()
  log.info(`${ctx(job)} step=${label} start`)
  try {
    const v = await fn()
    log.info(`${ctx(job)} step=${label} ok ms=${Date.now() - t0}`)
    return v
  } catch (e) {
    log.warn(`${ctx(job)} step=${label} fail ms=${Date.now() - t0}`, e)
    throw e
  }
}
