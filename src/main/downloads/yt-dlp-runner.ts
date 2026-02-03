import { spawn } from 'child_process'
import log from 'electron-log'
import ffmpeg from 'fluent-ffmpeg'
import fs, { mkdirSync } from 'fs'
import path from 'path'
import treeKill from 'tree-kill'

import type { DownloadJob } from '../../types/download.types'
import {
  findRealDownloadedFile,
  locateFfmpeg,
  locateYtDlp,
  parseYtDlpPercent
} from './yt-dlp-utils'

type RunningTask = {
  videoProcess?: ReturnType<typeof spawn>
  audioProcess?: ReturnType<typeof spawn>
  filename: string
  outputDir: string
  stopRequested?: boolean
}

class DownloadStoppedError extends Error {
  code = 'ERR_DOWNLOAD_STOPPED'
  constructor(public phase: 'video' | 'audio' | 'merge') {
    super(`Download stopped by user during ${phase}`)
    this.name = 'DownloadStoppedError'
  }
}

let currentTask: { jobId: string; task: RunningTask } | null = null

export function hasRunningTask(jobId: string): boolean {
  return currentTask?.jobId === jobId
}

let _ffmpegPath: string | null = null
let _ytDlpPath: string | null = null
let _binariesLogged = false

function ensureBinaries(): { ffmpegPath: string; ytDlpPath: string } {
  if (!_ffmpegPath) {
    _ffmpegPath = locateFfmpeg()
    ffmpeg.setFfmpegPath(_ffmpegPath)
  }
  if (!_ytDlpPath) {
    _ytDlpPath = locateYtDlp()
  }

  if (!_binariesLogged) {
    _binariesLogged = true
    log.info('[dl] binaries', {
      ffmpegPath: _ffmpegPath,
      ytDlpPath: _ytDlpPath,
      ytDlpExists: fs.existsSync(_ytDlpPath)
    })
  }

  return { ffmpegPath: _ffmpegPath, ytDlpPath: _ytDlpPath }
}

function ctx(job: DownloadJob): string {
  return `[dl] id=${job.id.slice(0, 8)} type=${job.type} name=${job.filename}`
}

async function step<T>(label: string, job: DownloadJob, fn: () => Promise<T>): Promise<T> {
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

const killAsync = (p?: ReturnType<typeof spawn>): Promise<void> => {
  return new Promise((resolve) => {
    if (!p || p.killed || !p.pid) return resolve()

    treeKill(p.pid, 'SIGKILL', (err) => {
      if (err) log.error(`[dl] kill fail pid=${p.pid} msg=${err.message}`)
      resolve()
    })
  })
}

async function resolveByPrefix(args: {
  job: DownloadJob
  dir: string
  prefix: string
  fallbackPattern: string
}): Promise<string> {
  const { job, dir, prefix, fallbackPattern } = args
  return step(`resolve:${prefix}`, job, async () => {
    const files = await fs.promises.readdir(dir)
    const hit = files.find((f) => f.startsWith(prefix + '.'))
    if (hit) return path.join(dir, hit)
    return findRealDownloadedFile(dir, fallbackPattern)
  })
}

export function runDownloadJob(
  job: DownloadJob,
  onProgress: (p: { percent?: number; current: DownloadJob['progress']['current'] }) => void
): Promise<{ outputFile: string }> {
  const { ffmpegPath, ytDlpPath } = ensureBinaries()

  const downloadDir = job.outputDir
  if (!fs.existsSync(downloadDir)) mkdirSync(downloadDir, { recursive: true })

  const baseName = job.filename
  const videoFile = path.join(downloadDir, `${baseName}_video.%(ext)s`)
  const audioFile = path.join(downloadDir, `${baseName}_audio.%(ext)s`)
  const outputFile = path.join(downloadDir, `${baseName}.mkv`)
  const audioOnlyFile = path.join(downloadDir, `${baseName}.%(ext)s`)

  const task: RunningTask = { filename: baseName, outputDir: downloadDir, stopRequested: false }
  currentTask = { jobId: job.id, task }

  log.info(`${ctx(job)} start url=${job.url}`)
  onProgress({ current: 'init' })

  const sendPercent = (current: 'video' | 'audio', text: string): void => {
    const percent = parseYtDlpPercent(text)
    if (percent != null) onProgress({ current, percent })
  }

  const runYtDlp = (args: string[], current: 'video' | 'audio'): Promise<void> => {
    return step(`yt-dlp:${current}`, job, async () => {
      if (task.stopRequested) throw new DownloadStoppedError(current)

      const proc = spawn(ytDlpPath, args, { windowsHide: true })

      if (current === 'video') task.videoProcess = proc
      if (current === 'audio') task.audioProcess = proc

      onProgress({ current, percent: 0 })

      proc.stdout.on('data', (data) => sendPercent(current, data.toString()))
      proc.stderr.on('data', (data) => {
        const t = data.toString()
        sendPercent(current, t)
        log.error(`${ctx(job)} yt-dlp:${current} stderr`, t)
      })

      await new Promise<void>((res, rej) => {
        proc.on('error', (err) => {
          if (task.stopRequested) return rej(new DownloadStoppedError(current))
          rej(err)
        })

        proc.on('close', (code) => {
          if (task.stopRequested) return rej(new DownloadStoppedError(current))
          code === 0 ? res() : rej(new Error(`${current} download failed: ${code}`))
        })
      })
    })
  }

  return (async () => {
    if (job.type === 'audio') {
      const args = [
        '--no-playlist',
        '-x',
        '--audio-format',
        'mp3',
        '--audio-quality',
        '0',
        '--ffmpeg-location',
        ffmpegPath,

        '--no-part',
        '--restrict-filenames',
        '--no-warnings',
        '--no-check-certificate',

        '--output',
        audioOnlyFile,
        job.url
      ]

      await runYtDlp(args, 'audio')

      const expected = path.join(downloadDir, `${baseName}.mp3`)
      const real = await step('output:audio', job, async () => {
        if (fs.existsSync(expected)) return expected
        return findRealDownloadedFile(downloadDir, `${baseName}.*`)
      })

      onProgress({ current: 'complete', percent: 100 })
      return { outputFile: real }
    }

    await runYtDlp(
      [
        '--no-playlist',
        '--format',
        'bv*',
        '--no-part',
        '--restrict-filenames',
        '--no-warnings',
        '--no-check-certificate',
        '--output',
        videoFile,
        job.url
      ],
      'video'
    )

    await runYtDlp(
      [
        '--no-playlist',
        '--format',
        'ba',
        '--no-part',
        '--restrict-filenames',
        '--no-warnings',
        '--no-check-certificate',
        '--output',
        audioFile,
        job.url
      ],
      'audio'
    )

    const mergedVideo = await resolveByPrefix({
      job,
      dir: downloadDir,
      prefix: `${baseName}_video`,
      fallbackPattern: `${baseName}_video.*`
    })

    const mergedAudio = await resolveByPrefix({
      job,
      dir: downloadDir,
      prefix: `${baseName}_audio`,
      fallbackPattern: `${baseName}_audio.*`
    })

    await step('ffmpeg:merge', job, async () => {
      if (task.stopRequested) throw new DownloadStoppedError('merge')

      await new Promise<void>((resolve, reject) => {
        ffmpeg(mergedVideo)
          .input(mergedAudio)
          .outputOptions('-c copy')
          .save(outputFile)
          .on('end', () => {
            try {
              fs.unlinkSync(mergedVideo)
              fs.unlinkSync(mergedAudio)
            } catch (e) {
              log.warn(`${ctx(job)} cleanup warn`, e)
            }
            resolve()
          })
          .on('error', (err) => {
            if (task.stopRequested) return reject(new DownloadStoppedError('merge'))
            reject(err)
          })
      })
    })

    onProgress({ current: 'complete', percent: 100 })
    return { outputFile }
  })().finally(() => {
    log.info(`${ctx(job)} end`)
    currentTask = null
  })
}

export async function stopCurrentJobAndCleanup(job: DownloadJob): Promise<void> {
  const task = currentTask?.jobId === job.id ? currentTask.task : null
  if (!task) return

  task.stopRequested = true
  log.warn(`${ctx(job)} stop requested`)

  await step('stop:kill', job, async () => {
    await Promise.all([killAsync(task.videoProcess), killAsync(task.audioProcess)])
  })

  await step('stop:cleanup', job, async () => {
    const { filename, outputDir } = task
    await new Promise((r) => setTimeout(r, 200))

    try {
      const files = await fs.promises.readdir(outputDir)
      for (const file of files) {
        if (!file.startsWith(filename)) continue
        try {
          await fs.promises.unlink(path.join(outputDir, file))
        } catch (e) {
          log.warn(`${ctx(job)} cleanup unlink warn`, e)
        }
      }
    } catch (e) {
      log.warn(`${ctx(job)} cleanup readdir warn`, e)
    }
  })
}

export function isDownloadStoppedError(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e != null &&
    // @ts-expect-error - runtime check
    (e.code === 'ERR_DOWNLOAD_STOPPED' || e.name === 'DownloadStoppedError')
  )
}
