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
