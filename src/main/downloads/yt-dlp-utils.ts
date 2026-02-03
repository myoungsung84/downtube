import { DownloadInfo } from '@src/types/download.types'
import { spawn } from 'child_process'
import { app } from 'electron'
import log from 'electron-log'
import glob from 'fast-glob'
import ffmpegStatic from 'ffmpeg-static'
import fs from 'fs'
import path from 'path'

const isWindows = process.platform === 'win32'

export function locateYtDlp(): string {
  const binaryName = isWindows ? 'yt-dlp.exe' : 'yt-dlp'

  if (app.isPackaged) {
    return path.resolve(process.resourcesPath, 'bin', binaryName)
  }

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

  log.error('[yt-dlp] not found. candidates=', candidates)
  return candidates[0]
}

export function locateFfmpeg(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'bin', isWindows ? 'ffmpeg.exe' : 'ffmpeg')
    : (ffmpegStatic as string)
}

export async function findRealDownloadedFile(dir: string, pattern: string): Promise<string> {
  const files = await glob(pattern, { cwd: dir, absolute: true })
  if (files.length === 0) throw new Error(`No file found for pattern: ${pattern}`)
  return files[0]
}

export function parseYtDlpPercent(text: string): number | null {
  const match = text.match(/\[download\]\s+(\d{1,3}\.\d)%/)
  if (!match) return null

  const percent = Math.round(parseFloat(match[1]))
  if (Number.isNaN(percent)) return null
  return percent
}

type YtDlpDumpJson = {
  id?: string | number
  title?: string
  fulltitle?: string
  uploader?: string
  channel?: string
  thumbnail?: string
  thumbnails?: Array<{ url?: string; width?: number; height?: number }>
  duration?: number
  webpage_url?: string
  extractor?: string
  is_live?: boolean
  availability?: string
  formats?: unknown[]
}

function pickBestThumbnail(
  thumbnails?: Array<{ url?: string; width?: number; height?: number }>
): string | undefined {
  if (!thumbnails?.length) return undefined
  return [...thumbnails].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url
}

function safeParseJson(text: string): unknown {
  return JSON.parse(text.trim())
}

function collectStderr(chunks: string[], data: Buffer | string): void {
  chunks.push(data.toString())
}

function asYtDlpDumpJson(v: unknown): YtDlpDumpJson {
  return v as YtDlpDumpJson
}

export function downloadInfo(url: string): Promise<DownloadInfo> {
  const ytDlpPath = locateYtDlp()

  return new Promise<DownloadInfo>((res, rej) => {
    const args = [
      '--no-check-certificate',
      '--no-cache-dir',
      '--no-warnings',
      '--no-playlist',
      '--dump-json',
      url
    ]

    const p = spawn(ytDlpPath, args, { windowsHide: true })

    let stdout = ''
    const stderrChunks: string[] = []

    p.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    p.stderr.on('data', (data: Buffer) => {
      collectStderr(stderrChunks, data)
      log.error('[yt-dlp stderr]', data.toString())
    })

    p.on('error', (err: Error) => {
      log.error('[yt-dlp error]', err)
      rej(new Error(`yt-dlp spawn failed: ${err.message}`))
    })

    p.on('close', (code: number | null) => {
      const exitCode = code ?? -1

      if (exitCode !== 0) {
        const tail = stderrChunks.join('').trim().slice(-2000)
        return rej(new Error(`yt-dlp exited with code ${exitCode}${tail ? `\n\n${tail}` : ''}`))
      }
      try {
        const raw = asYtDlpDumpJson(safeParseJson(stdout))
        const info: DownloadInfo = {
          id: String(raw.id ?? ''),
          url,
          title: String(raw.title ?? raw.fulltitle ?? raw.id ?? 'unknown'),
          uploader: raw.uploader ? String(raw.uploader) : undefined,
          channel: raw.channel ? String(raw.channel) : undefined,
          thumbnail: raw.thumbnail ? String(raw.thumbnail) : pickBestThumbnail(raw.thumbnails),
          duration: typeof raw.duration === 'number' ? raw.duration : undefined,
          webpageUrl: raw.webpage_url ? String(raw.webpage_url) : undefined,
          extractor: raw.extractor ? String(raw.extractor) : undefined,
          isLive: typeof raw.is_live === 'boolean' ? raw.is_live : undefined,
          availability: raw.availability ? String(raw.availability) : undefined,
          formatsCount: Array.isArray(raw.formats) ? raw.formats.length : undefined
        }

        if (!info.id) {
          return rej(new Error('yt-dlp returned JSON but missing "id" (unexpected payload)'))
        }

        res(info)
      } catch (e) {
        const preview = stdout.trim().slice(0, 1500)
        rej(new Error(`Invalid JSON from yt-dlp: ${String(e)}\n\nstdout preview:\n${preview}`))
      }
    })
  })
}
