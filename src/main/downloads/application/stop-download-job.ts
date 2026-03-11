import log from 'electron-log'
import treeKill from 'tree-kill'

import { cleanupFilesByPrefix } from '../adapters/fs/cleanup'
import { ctx, step } from '../shared/download-helpers'
import type { DownloadJob } from '../types'
import { getCurrentTask } from './run-download-job'

const killAsync = (p?: { killed?: boolean; pid?: number | undefined }): Promise<void> => {
  return new Promise((resolve) => {
    if (!p || p.killed || !p.pid) return resolve()

    treeKill(p.pid, 'SIGKILL', (err) => {
      if (err) log.error(`[dl] kill fail pid=${p.pid} msg=${err.message}`)
      resolve()
    })
  })
}

export async function stopCurrentJobAndCleanup(job: DownloadJob): Promise<void> {
  const task = getCurrentTask(job.id)
  if (!task) return

  task.stopRequested = true
  log.warn(`${ctx(job)} stop requested`)

  await step('stop:kill', job, async () => {
    await Promise.all([killAsync(task.videoProcess), killAsync(task.audioProcess)])
  })

  await step('stop:cleanup', job, async () => {
    await new Promise((r) => setTimeout(r, 200))

    try {
      await cleanupFilesByPrefix({ dir: task.outputDir, filenamePrefix: task.filename })
    } catch (e) {
      log.warn(`${ctx(job)} cleanup readdir warn`, e)
    }
  })
}
