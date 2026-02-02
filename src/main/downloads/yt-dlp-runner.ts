import { spawn } from 'child_process'
import { app } from 'electron'
import log from 'electron-log'
import glob from 'fast-glob'
import ffmpegStatic from 'ffmpeg-static'
import ffmpeg from 'fluent-ffmpeg'
import fs, { mkdirSync } from 'fs'
import path from 'path'
import treeKill from 'tree-kill'

import type { DownloadJob } from './download.types'
import { parseYtDlpPercent } from './yt-dlp-parser'

const isWindows = process.platform === 'win32'

type RunningTask = {
  videoProcess?: ReturnType<typeof spawn>
  audioProcess?: ReturnType<typeof spawn>
  filename: string
  outputDir: string
}

let currentTask: { jobId: string; task: RunningTask } | null = null

function locateYtDlp(): string {
  const binaryName = isWindows ? 'yt-dlp.exe' : 'yt-dlp'

  if (app.isPackaged) {
    return path.resolve(process.resourcesPath, 'bin', binaryName)
  }

  // dev: 다양한 cwd/appPath 케이스를 강제로 커버
  const candidates = [
    path.resolve(app.getAppPath(), 'bin', binaryName),
    path.resolve(app.getAppPath(), '..', 'bin', binaryName),
    path.resolve(app.getAppPath(), '../..', 'bin', binaryName),

    path.resolve(process.cwd(), 'bin', binaryName),
    path.resolve(process.cwd(), '..', 'bin', binaryName),
    path.resolve(process.cwd(), '../..', 'bin', binaryName)
  ]

  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }

  // 디버깅용 로그(경로 후보 확인)
  log.error('[yt-dlp] not found. candidates=', candidates)
  return candidates[0]
}

function locateFfmpeg(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'bin', isWindows ? 'ffmpeg.exe' : 'ffmpeg')
    : (ffmpegStatic as string)
}

async function findRealDownloadedFile(dir: string, pattern: string): Promise<string> {
  const files = await glob(pattern, { cwd: dir, absolute: true })
  if (files.length === 0) throw new Error(`No file found for pattern: ${pattern}`)
  return files[0]
}

export function hasRunningTask(jobId: string): boolean {
  return currentTask?.jobId === jobId
}

export function runDownloadJob(
  job: DownloadJob,
  onProgress: (p: { percent?: number; current: DownloadJob['progress']['current'] }) => void
): Promise<{ outputFile: string }> {
  const ffmpegPath = locateFfmpeg()
  ffmpeg.setFfmpegPath(ffmpegPath)
  log.info('ffmpeg path:', ffmpegPath)

  const ytDlpPath = locateYtDlp()
  log.info('[yt-dlp] path', ytDlpPath)
  log.info('[yt-dlp] exists', fs.existsSync(ytDlpPath))
  const downloadDir = job.outputDir
  if (!fs.existsSync(downloadDir)) mkdirSync(downloadDir, { recursive: true })

  const baseName = job.filename
  const videoFile = path.join(downloadDir, `${baseName}_video.%(ext)s`)
  const audioFile = path.join(downloadDir, `${baseName}_audio.%(ext)s`)
  const outputFile = path.join(downloadDir, `${baseName}.mkv`)

  const task: RunningTask = {
    filename: baseName,
    outputDir: downloadDir
  }
  currentTask = { jobId: job.id, task }

  onProgress({ current: 'init' })

  const send = (current: 'video' | 'audio', text: string): void => {
    const percent = parseYtDlpPercent(text)
    if (percent != null) onProgress({ current, percent })
  }

  return (async () => {
    // video
    await new Promise<void>((res, rej) => {
      const args = [
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
      ]
      const videoProc = spawn(ytDlpPath, args)
      task.videoProcess = videoProc

      videoProc.stdout.on('data', (data) => send('video', data.toString()))
      videoProc.stderr.on('data', (data) => log.error('[yt-dlp video stderr]', data.toString()))

      videoProc.on('error', (err) => rej(err))
      videoProc.on('close', (code) =>
        code === 0 ? res() : rej(new Error(`video download failed: ${code}`))
      )
    })

    // audio
    await new Promise<void>((res, rej) => {
      const args = [
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
      ]
      const audioProc = spawn(ytDlpPath, args)
      task.audioProcess = audioProc

      audioProc.stdout.on('data', (data) => send('audio', data.toString()))
      audioProc.stderr.on('data', (data) => log.error('[yt-dlp audio stderr]', data.toString()))

      audioProc.on('error', (err) => rej(err))
      audioProc.on('close', (code) =>
        code === 0 ? res() : rej(new Error(`audio download failed: ${code}`))
      )
    })

    const mergedVideo = await findRealDownloadedFile(downloadDir, `${baseName}_video.*`)
    const mergedAudio = await findRealDownloadedFile(downloadDir, `${baseName}_audio.*`)

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
            log.warn('[cleanup warn]', e)
          }
          resolve()
        })
        .on('error', (err) => reject(err))
    })

    onProgress({ current: 'complete', percent: 100 })
    return { outputFile }
  })().finally(() => {
    currentTask = null
  })
}

export async function stopCurrentJobAndCleanup(job: DownloadJob): Promise<void> {
  const task = currentTask?.jobId === job.id ? currentTask.task : null
  if (!task) return

  const kill = (p?: ReturnType<typeof spawn>): void => {
    if (p && !p.killed && p.pid) {
      treeKill(p.pid, 'SIGKILL', (err) => {
        if (err) log.error(`[ERROR] Failed to kill process: ${err.message}`)
      })
    }
  }

  kill(task.videoProcess)
  kill(task.audioProcess)

  // 파일 정리 (기존 download-stop 로직 최대한 유지)
  const { filename, outputDir } = task
  await new Promise((r) => setTimeout(r, 800))

  try {
    const files = await fs.promises.readdir(outputDir)
    for (const file of files) {
      if (file.startsWith(filename)) {
        const filePath = path.join(outputDir, file)
        try {
          await fs.promises.unlink(filePath)
        } catch (e) {
          log.warn('[cleanup unlink warn]', e)
        }
      }
    }
  } catch (e) {
    log.warn('[cleanup readdir warn]', e)
  }
}
