import { type ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { app } from 'electron'
import log from 'electron-log'
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

export function parseYtDlpPercent(text: string): number | null {
  const match = text.match(/\[download\]\s+(\d{1,3}\.\d)%/)
  if (!match) return null

  const percent = Math.round(parseFloat(match[1]))
  if (Number.isNaN(percent)) return null
  return percent
}

export function spawnYtDlp(ytDlpPath: string, args: string[]): ChildProcessWithoutNullStreams {
  return spawn(ytDlpPath, args, { windowsHide: true }) as ChildProcessWithoutNullStreams
}
