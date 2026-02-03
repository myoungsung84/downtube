import { spawn } from 'child_process'
import fs from 'fs'

import { locateYtDlp } from './yt-dlp-utils'

export type PlaylistItem = {
  url: string
  id?: string
  title?: string
  durationSec?: number
  thumbnail?: string
}

/**
 * Playlist URL을 flat 모드로 파싱해서 개별 영상 URL 목록을 반환한다.
 * - --flat-playlist + -J 로 entries만 빠르게 가져옴
 * - 대규모 playlist에서도 metadata를 최소화해서 속도/부하 줄임
 */
export async function parsePlaylistItems(args: { playlistUrl: string }): Promise<PlaylistItem[]> {
  const ytDlpPath = locateYtDlp()
  if (!fs.existsSync(ytDlpPath)) {
    throw new Error(`[yt-dlp] not found: ${ytDlpPath}`)
  }

  const { playlistUrl } = args

  const cmdArgs = [
    '--flat-playlist',
    '-J',
    '--no-warnings',
    '--no-check-certificate',
    '--no-playlist-reverse',
    playlistUrl
  ]

  const stdout = await new Promise<string>((resolve, reject) => {
    const p = spawn(ytDlpPath, cmdArgs, { windowsHide: true })

    let out = ''
    let err = ''

    p.stdout.on('data', (d) => (out += String(d)))
    p.stderr.on('data', (d) => (err += String(d)))

    p.on('error', reject)
    p.on('close', (code) => {
      if (code === 0) return resolve(out)
      reject(new Error(err || `yt-dlp playlist parse failed: code=${code}`))
    })
  })

  // yt-dlp -J 결과 형태 (필요 최소만)
  const json = JSON.parse(stdout) as {
    entries?: Array<{
      id?: string
      url?: string
      title?: string
      duration?: number
      thumbnail?: string
      webpage_url?: string
      ie_key?: string
      extractor_key?: string
    }>
  }

  const entries = json.entries ?? []

  const items: PlaylistItem[] = []

  for (const e of entries) {
    // 가장 우선: webpage_url
    let url = (e.webpage_url ?? '').trim()

    // 다음: id로 유튜브 watch URL 구성
    if (!url && e.id) {
      url = `https://www.youtube.com/watch?v=${e.id}`
    }

    // 다음: url 값이 id이거나 상대형일 수 있음 (yt-dlp flat에서 자주 나옴)
    if (!url && e.url) {
      const u = String(e.url).trim()
      if (/^https?:\/\//i.test(u)) url = u
      else if (u) url = `https://www.youtube.com/watch?v=${u}`
    }

    if (!url) continue

    items.push({
      url,
      id: e.id,
      title: e.title,
      durationSec: typeof e.duration === 'number' ? e.duration : undefined,
      thumbnail: e.thumbnail
    })
  }

  return items
}
