import { app } from 'electron'
import ffmpegStatic from 'ffmpeg-static'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'

const isWindows = process.platform === 'win32'

export function locateFfmpeg(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'bin', isWindows ? 'ffmpeg.exe' : 'ffmpeg')
    : (ffmpegStatic as string)
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
