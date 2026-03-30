import { app } from 'electron'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import { createRequire } from 'module'
import path from 'path'

const isWindows = process.platform === 'win32'
const requireFromCjs = createRequire(import.meta.url)

function locateBinary(name: 'ffmpeg' | 'ffprobe'): string {
  const binaryName = isWindows ? `${name}.exe` : name

  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'bin', binaryName)
  }

  const candidates = [
    path.resolve(app.getAppPath(), 'bin', binaryName),
    path.resolve(app.getAppPath(), '..', 'bin', binaryName),
    path.resolve(app.getAppPath(), '../..', 'bin', binaryName),
    path.resolve(process.cwd(), 'bin', binaryName),
    path.resolve(process.cwd(), '..', 'bin', binaryName),
    path.resolve(process.cwd(), '../..', 'bin', binaryName)
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }

  // dev fallback: ffmpeg-static / ffprobe-static은 devDependencies에만 존재

  return name === 'ffmpeg'
    ? (requireFromCjs('ffmpeg-static') as string)
    : (requireFromCjs('ffprobe-static') as { path: string }).path
}

export function locateFfmpeg(): string {
  return locateBinary('ffmpeg')
}

export function locateFfprobe(): string {
  return locateBinary('ffprobe')
}

export function configureFfmpegPath(ffmpegPath: string): void {
  ffmpeg.setFfmpegPath(ffmpegPath)
}

export async function mergeMediaFiles(args: {
  videoPath: string
  audioPath: string
  outputFile: string
  metadataOptions?: string[]
}): Promise<void> {
  const { videoPath, audioPath, outputFile, metadataOptions = [] } = args

  await new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .input(audioPath)
      .outputOptions(['-c', 'copy', ...metadataOptions])
      .save(outputFile)
      .on('end', resolve)
      .on('error', reject)
  })
}
