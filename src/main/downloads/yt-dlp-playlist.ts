import type { DownloadInfo } from '@src/types/download.types'
import { spawn } from 'child_process'
import fs from 'fs'
import treeKill from 'tree-kill'

import { locateYtDlp } from './yt-dlp-utils'

type YoutubeTabPlaylistJson = {
  extractor?: string
  extractor_key?: string
  playlist_count?: number
  entries?: Array<{
    _type?: string
    id?: string
    url?: string
    title?: string
    duration?: number
    channel?: string
    uploader?: string
    availability?: string
    live_status?: string | null
    thumbnails?: Array<{ url?: string; width?: number; height?: number }>
    webpage_url?: string
  }>
}

function safeParseJson(text: string): unknown {
  return JSON.parse(text.trim())
}

function asYoutubeTabPlaylistJson(v: unknown): YoutubeTabPlaylistJson {
  return v as YoutubeTabPlaylistJson
}

function collectStderr(chunks: string[], data: Buffer | string): void {
  chunks.push(data.toString())
}

function pickBestThumbnail(
  thumbnails?: Array<{ url?: string; width?: number; height?: number }>
): string | undefined {
  if (!thumbnails?.length) return undefined
  const sorted = [...thumbnails].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))
  return sorted[0]?.url
}

function normalizePlaylistUrl(input: string): string {
  let s = input.trim()
  s = s.replace(/^["']+/, '').replace(/["']+$/, '')
  s = s.replace(/^youtubetabplaylistjson/i, '')

  if (/^https\/\//i.test(s)) s = s.replace(/^https\/\//i, 'https://')
  if (!/^https?:\/\//i.test(s) && /^www\./i.test(s)) s = `https://${s}`

  if (!/^https?:\/\//i.test(s)) {
    throw new Error(`Invalid playlistUrl: "${input}"`)
  }
  return s
}

function normalizeLimit(input: unknown, fallback: number, max: number): number {
  const n = typeof input === 'number' ? input : Number(input)
  if (!Number.isFinite(n)) return fallback
  const i = Math.floor(n)
  if (i <= 0) return fallback
  return Math.min(i, max)
}

export async function parsePlaylistInfos(args: {
  playlistUrl: string
  playlistLimit: number
  timeoutMs?: number
}): Promise<DownloadInfo[]> {
  const ytDlpPath = locateYtDlp()
  if (!fs.existsSync(ytDlpPath)) {
    throw new Error(`[yt-dlp] not found: ${ytDlpPath}`)
  }

  const normalized = normalizePlaylistUrl(args.playlistUrl)

  const limit = normalizeLimit(args.playlistLimit, 50, 500)
  const timeoutMs = normalizeLimit(args.timeoutMs, 30_000, 120_000)

  console.log('parsePlaylistInfos: normalized url=', normalized, 'limit=', limit)

  const cmdArgs = [
    '--flat-playlist',
    '-J',
    '--no-warnings',
    '--no-check-certificate',
    '--no-playlist-reverse',
    '--playlist-end',
    String(limit),
    normalized
  ]

  const stdout = await new Promise<string>((resolve, reject) => {
    const p = spawn(ytDlpPath, cmdArgs, { windowsHide: true })

    let out = ''
    const stderrChunks: string[] = []

    const timer = setTimeout(() => {
      try {
        if (p.pid) treeKill(p.pid)
      } catch {
        // ignore
      }
      const tail = stderrChunks.join('').trim().slice(-2000)
      reject(new Error(`yt-dlp playlist parse timeout: ${timeoutMs}ms${tail ? `\n\n${tail}` : ''}`))
    }, timeoutMs)

    p.stdout.on('data', (d: Buffer) => {
      out += d.toString()
    })

    p.stderr.on('data', (d: Buffer) => {
      collectStderr(stderrChunks, d)
    })

    p.on('error', (err: Error) => {
      clearTimeout(timer)
      reject(new Error(`yt-dlp spawn failed: ${err.message}`))
    })

    p.on('close', (code: number | null) => {
      clearTimeout(timer)

      const exitCode = code ?? -1
      if (exitCode === 0) return resolve(out)

      const tail = stderrChunks.join('').trim().slice(-2000)
      reject(
        new Error(`yt-dlp playlist parse failed: code=${exitCode}${tail ? `\n\n${tail}` : ''}`)
      )
    })
  })

  const root = asYoutubeTabPlaylistJson(safeParseJson(stdout))
  const entries = root.entries ?? []

  const infos: DownloadInfo[] = []

  for (const e of entries) {
    let url = (e.webpage_url ?? '').trim()

    if (!url && e.id) url = `https://www.youtube.com/watch?v=${e.id}`
    if (!url && e.url) {
      const u = String(e.url).trim()
      if (/^https?:\/\//i.test(u)) url = u
      else if (u) url = `https://www.youtube.com/watch?v=${u}`
    }

    if (!url) continue

    const duration =
      typeof e.duration === 'number' && Number.isFinite(e.duration) ? e.duration : undefined

    const isLive = typeof e.live_status === 'string' ? e.live_status !== 'not_live' : undefined

    infos.push({
      id: String(e.id ?? url),
      url,
      title: String(e.title ?? e.id ?? 'unknown'),
      uploader: e.uploader ? String(e.uploader) : undefined,
      channel: e.channel ? String(e.channel) : undefined,
      thumbnail: pickBestThumbnail(e.thumbnails),
      duration,
      webpageUrl: url,
      extractor: root.extractor ? String(root.extractor) : undefined,
      isLive,
      availability: e.availability ? String(e.availability) : undefined,
      formatsCount: undefined
    })
  }

  return infos
}
