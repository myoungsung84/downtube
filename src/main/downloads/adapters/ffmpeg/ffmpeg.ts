import { app } from 'electron'
import ffmpegStatic from 'ffmpeg-static'
import ffprobeStatic from 'ffprobe-static'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'

const isWindows = process.platform === 'win32'

function locateBinary(name: 'ffmpeg' | 'ffprobe'): string {
  const binaryName = isWindows ? `${name}.exe` : name
  return app.isPackaged
    ? path.join(process.resourcesPath, 'bin', binaryName)
    : name === 'ffmpeg'
      ? (ffmpegStatic as string) // ffmpeg-static exports path as default string
      : ffprobeStatic.path // ffprobe-static exports { path: string }
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
