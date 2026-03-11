import type { ChildProcessWithoutNullStreams } from 'child_process'
import log from 'electron-log'
import fs, { mkdirSync } from 'fs'
import path from 'path'

import { configureFfmpegPath, locateFfmpeg, mergeMediaFiles } from '../adapters/ffmpeg/ffmpeg'
import { removeFileIfExists, removeFilesSync } from '../adapters/fs/cleanup'
import { findRealDownloadedFile, resolveByPrefixInDir } from '../adapters/fs/resolver'
import { locateYtDlp, parseYtDlpPercent, spawnYtDlp } from '../adapters/yt-dlp/yt-dlp'
import { ctx, step } from '../shared/download-helpers'
import type { DownloadJob } from '../types'

export class DownloadStoppedError extends Error {
  code = 'ERR_DOWNLOAD_STOPPED'
  constructor(public phase: 'video' | 'audio' | 'merge') {
    super(`Download stopped by user during ${phase}`)
    this.name = 'DownloadStoppedError'
  }
}

type RunningTask = {
  videoProcess?: ChildProcessWithoutNullStreams
  audioProcess?: ChildProcessWithoutNullStreams
  filename: string
  outputDir: string
  stopRequested?: boolean
}

let currentTask: { jobId: string; task: RunningTask } | null = null

function setCurrentTask(jobId: string, task: RunningTask): void {
  currentTask = { jobId, task }
}

function clearCurrentTask(): void {
  currentTask = null
}

export function getCurrentTask(jobId: string): RunningTask | null {
  if (currentTask?.jobId !== jobId) return null
  return currentTask.task
}

export function hasRunningTask(jobId: string): boolean {
  return currentTask?.jobId === jobId
}

export function isDownloadStoppedError(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e != null &&
    // @ts-expect-error - runtime check
    (e.code === 'ERR_DOWNLOAD_STOPPED' || e.name === 'DownloadStoppedError')
  )
}

let _ffmpegPath: string | null = null
let _ytDlpPath: string | null = null
let _binariesLogged = false

function ensureBinaries(): { ffmpegPath: string; ytDlpPath: string } {
  if (!_ffmpegPath) {
    _ffmpegPath = locateFfmpeg()
    configureFfmpegPath(_ffmpegPath)
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

function sanitizeMetadataValue(value?: string): string | undefined {
  if (!value) return undefined

  const trimmed = value.trim()
  if (!trimmed) return undefined

  const normalized = trimmed
    .split('\0')
    .join('')
    .replace(/\r?\n+/g, ' ')
    .replace(/["'`\\=]/g, '')
    .replace(/[|<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return normalized || undefined
}

function buildFfmpegMetadataOptions(info?: DownloadJob['info']): string[] {
  if (!info) return []

  const title = sanitizeMetadataValue(info.title)
  const artist = sanitizeMetadataValue(info.uploader ?? info.channel)

  const options: string[] = []
  if (title) options.push('-metadata', `title=${title}`)
  if (artist) options.push('-metadata', `artist=${artist}`)
  return options
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
  setCurrentTask(job.id, task)

  log.info(`${ctx(job)} start url=${job.url}`)
  onProgress({ current: 'init' })

  const sendPercent = (current: 'video' | 'audio', text: string): void => {
    const percent = parseYtDlpPercent(text)
    if (percent != null) onProgress({ current, percent })
  }

  const runYtDlp = (args: string[], current: 'video' | 'audio'): Promise<void> => {
    return step(`yt-dlp:${current}`, job, async () => {
      if (task.stopRequested) throw new DownloadStoppedError(current)

      const proc = spawnYtDlp(ytDlpPath, args)

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
        '--embed-metadata',
        '--embed-thumbnail',
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
        'bestvideo*/bv*',
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
        'bestaudio*/ba/bestaudio/best',
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

    const mergedVideo = await step(`resolve:${baseName}_video`, job, async () =>
      resolveByPrefixInDir({
        dir: downloadDir,
        prefix: `${baseName}_video`,
        fallbackPattern: `${baseName}_video.*`
      })
    )

    const mergedAudio = await step(`resolve:${baseName}_audio`, job, async () =>
      resolveByPrefixInDir({
        dir: downloadDir,
        prefix: `${baseName}_audio`,
        fallbackPattern: `${baseName}_audio.*`
      })
    )

    await step('ffmpeg:merge', job, async () => {
      if (task.stopRequested) throw new DownloadStoppedError('merge')

      const metadataOptions = buildFfmpegMetadataOptions(job.info)

      try {
        await mergeMediaFiles({
          videoPath: mergedVideo,
          audioPath: mergedAudio,
          outputFile,
          metadataOptions
        })
      } catch (error) {
        if (task.stopRequested) throw new DownloadStoppedError('merge')

        if (metadataOptions.length === 0) {
          throw error
        }

        log.warn(`${ctx(job)} merge metadata fallback`, error)

        try {
          removeFileIfExists(outputFile)
        } catch (unlinkError) {
          log.warn(`${ctx(job)} merge fallback cleanup warn`, unlinkError)
        }

        await mergeMediaFiles({
          videoPath: mergedVideo,
          audioPath: mergedAudio,
          outputFile
        })
      }

      try {
        removeFilesSync([mergedVideo, mergedAudio])
      } catch (e) {
        log.warn(`${ctx(job)} cleanup warn`, e)
      }
    })

    onProgress({ current: 'complete', percent: 100 })
    return { outputFile }
  })().finally(() => {
    log.info(`${ctx(job)} end`)
    clearCurrentTask()
  })
}
