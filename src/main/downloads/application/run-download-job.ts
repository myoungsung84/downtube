import type { ChildProcessWithoutNullStreams } from 'child_process'
import log from 'electron-log'
import fs, { mkdirSync } from 'fs'
import path from 'path'

import type { MediaSidecarData } from '../../../types/media-sidecar.types'
import { configureFfmpegPath, locateFfmpeg, mergeMediaFiles } from '../adapters/ffmpeg/ffmpeg'
import {
  removeFileIfExists,
  removeFilesIfExistsSync,
  removeFilesSync
} from '../adapters/fs/cleanup'
import { findRealDownloadedFile, resolveByPrefixInDir } from '../adapters/fs/resolver'
import { locateYtDlp, parseYtDlpPercent, spawnYtDlp } from '../adapters/yt-dlp/yt-dlp'
import { ctx, logYtDlpArgs, logYtDlpStdout, step } from '../shared/download-helpers'
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

function getSidecarBasePath(outputFile: string): string {
  const ext = path.extname(outputFile)
  return ext ? outputFile.slice(0, -ext.length) : outputFile
}

function buildSidecarMetadata(job: DownloadJob, outputFile: string): MediaSidecarData {
  return {
    id: job.id,
    url: job.url,
    type: job.type,
    filename: job.filename,
    outputFile: path.basename(outputFile),
    outputPath: outputFile,
    downloadedAt: new Date().toISOString(),
    info: job.info ?? null
  }
}

async function writeSidecarJson(job: DownloadJob, outputFile: string): Promise<void> {
  const jsonPath = `${getSidecarBasePath(outputFile)}.json`
  const metadata = buildSidecarMetadata(job, outputFile)

  await fs.promises.writeFile(jsonPath, JSON.stringify(metadata, null, 2), 'utf-8')
}

function inferThumbnailExtension(thumbnailUrl: string, contentType?: string | null): string {
  const lowerContentType = contentType?.toLowerCase() ?? ''
  if (lowerContentType.includes('image/jpeg') || lowerContentType.includes('image/jpg'))
    return '.jpg'
  if (lowerContentType.includes('image/png')) return '.png'
  if (lowerContentType.includes('image/webp')) return '.webp'

  try {
    const url = new URL(thumbnailUrl)
    const ext = path.extname(url.pathname).toLowerCase()
    if (ext === '.jpg' || ext === '.jpeg') return '.jpg'
    if (ext === '.png') return '.png'
    if (ext === '.webp') return '.webp'
  } catch {
    // ignore extension parse failure
  }

  return '.jpg'
}

async function writeSidecarThumbnail(job: DownloadJob, outputFile: string): Promise<void> {
  const thumbnailUrl = job.info?.thumbnail?.trim()
  if (!thumbnailUrl) return

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10_000)

  let response: Response
  try {
    response = await fetch(thumbnailUrl, { signal: controller.signal })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      log.warn(`${ctx(job)} thumbnail fetch timed out`)
    } else {
      log.warn(`${ctx(job)} thumbnail fetch failed`, error)
    }
    return
  } finally {
    clearTimeout(timeoutId)
  }

  if (!response.ok) {
    log.warn(`${ctx(job)} thumbnail download failed with status ${response.status}`)
    return
  }

  const thumbnailExt = inferThumbnailExtension(thumbnailUrl, response.headers.get('content-type'))
  const sidecarBasePath = getSidecarBasePath(outputFile)

  removeFilesIfExistsSync([
    `${sidecarBasePath}.jpg`,
    `${sidecarBasePath}.png`,
    `${sidecarBasePath}.webp`
  ])

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  await fs.promises.writeFile(`${sidecarBasePath}${thumbnailExt}`, buffer)
}

async function writeOutputSidecars(job: DownloadJob, outputFile: string): Promise<void> {
  try {
    await writeSidecarJson(job, outputFile)
  } catch (error) {
    log.warn(`${ctx(job)} json sidecar warn`, error)
  }

  try {
    await writeSidecarThumbnail(job, outputFile)
  } catch (error) {
    log.warn(`${ctx(job)} thumbnail sidecar warn`, error)
  }
}

function buildBestVideoArgs(outputTemplate: string, url: string): string[] {
  return [
    '--no-playlist',
    '--format',
    'bv',
    '--print',
    'before_dl:[selected-video] id=%(format_id)s ext=%(ext)s res=%(resolution)s fps=%(fps)s vcodec=%(vcodec)s tbr=%(tbr)s filesize=%(filesize,s)s',
    '--progress',
    '--progress-delta',
    '1',
    '--newline',
    '--no-part',
    '--restrict-filenames',
    '--no-warnings',
    '--no-check-certificate',
    '--output',
    outputTemplate,
    url
  ]
}

function buildBestAudioArgs(outputTemplate: string, url: string): string[] {
  return [
    '--no-playlist',
    '--format',
    'ba',
    '--print',
    'before_dl:[selected-audio] id=%(format_id)s ext=%(ext)s abr=%(abr)s asr=%(asr)s acodec=%(acodec)s filesize=%(filesize,s)s',
    '--progress',
    '--progress-delta',
    '1',
    '--newline',
    '--no-part',
    '--restrict-filenames',
    '--no-warnings',
    '--no-check-certificate',
    '--output',
    outputTemplate,
    url
  ]
}

function attachYtDlpOutputListeners(
  proc: ChildProcessWithoutNullStreams,
  job: DownloadJob,
  current: 'video' | 'audio',
  onPercent: (text: string) => void
): void {
  let stdoutBuffer = ''
  let stderrBuffer = ''

  const flushBuffer = (
    source: 'stdout' | 'stderr',
    chunk: string,
    logger: (line: string) => void
  ): void => {
    const next = `${source === 'stdout' ? stdoutBuffer : stderrBuffer}${chunk}`.replace(/\r/g, '\n')
    const parts = next.split('\n')
    const rest = parts.pop() ?? ''

    if (source === 'stdout') stdoutBuffer = rest
    else stderrBuffer = rest

    for (const line of parts) {
      const trimmed = line.trim()
      if (!trimmed) continue
      onPercent(trimmed)
      logger(trimmed)
    }
  }

  proc.stdout.on('data', (data) => {
    flushBuffer('stdout', data.toString(), (line) => {
      logYtDlpStdout(job, current, line)
    })
  })

  proc.stderr.on('data', (data) => {
    flushBuffer('stderr', data.toString(), (line) => {
      log.error(`${ctx(job)} yt-dlp:${current} stderr`, line)
    })
  })

  proc.on('close', () => {
    const stdoutRest = stdoutBuffer.trim()
    const stderrRest = stderrBuffer.trim()

    if (stdoutRest) {
      onPercent(stdoutRest)
      logYtDlpStdout(job, current, stdoutRest)
    }

    if (stderrRest) {
      onPercent(stderrRest)
      log.error(`${ctx(job)} yt-dlp:${current} stderr`, stderrRest)
    }
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

      logYtDlpArgs(job, current, args)

      const proc = spawnYtDlp(ytDlpPath, args)

      if (current === 'video') task.videoProcess = proc
      if (current === 'audio') task.audioProcess = proc

      onProgress({ current, percent: 0 })

      attachYtDlpOutputListeners(proc, job, current, (text) => sendPercent(current, text))

      await new Promise<void>((res, rej) => {
        proc.on('error', (err) => {
          if (task.stopRequested) return rej(new DownloadStoppedError(current))
          rej(err)
        })

        proc.on('close', (code) => {
          if (task.stopRequested) return rej(new DownloadStoppedError(current))
          code === 0 ? res() : rej(new Error(`${current} download failed with exit code ${code}`))
        })
      })
    })
  }

  return (async () => {
    if (job.type === 'audio') {
      const args = [
        ...buildBestAudioArgs(audioOnlyFile, job.url),
        '-x',
        '--audio-format',
        'mp3',
        '--audio-quality',
        '0',
        '--ffmpeg-location',
        ffmpegPath,
        '--embed-metadata',
        '--embed-thumbnail'
      ]

      await runYtDlp(args, 'audio')

      const expected = path.join(downloadDir, `${baseName}.mp3`)
      const real = await step('output:audio', job, async () => {
        if (fs.existsSync(expected)) return expected
        return findRealDownloadedFile(downloadDir, `${baseName}.*`)
      })

      await step('sidecar:audio', job, async () => {
        if (task.stopRequested) throw new DownloadStoppedError('audio')
        await writeOutputSidecars(job, real)
      })

      onProgress({ current: 'complete', percent: 100 })
      return { outputFile: real }
    }

    await runYtDlp(buildBestVideoArgs(videoFile, job.url), 'video')

    await runYtDlp(buildBestAudioArgs(audioFile, job.url), 'audio')

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

    await step('sidecar:video', job, async () => {
      if (task.stopRequested) throw new DownloadStoppedError('video')
      await writeOutputSidecars(job, outputFile)
    })

    onProgress({ current: 'complete', percent: 100 })
    return { outputFile }
  })().finally(() => {
    log.info(`${ctx(job)} end`)
    clearCurrentTask()
  })
}
