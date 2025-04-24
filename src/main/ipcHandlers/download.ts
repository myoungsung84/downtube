import { VideoInfo } from '@src/types/video-info.types'
import { spawn } from 'child_process'
import { BrowserWindow, ipcMain, shell } from 'electron'
import { app } from 'electron'
import log from 'electron-log'
import ffmpegStatic from 'ffmpeg-static'
import ffmpeg from 'fluent-ffmpeg'
import fs, { mkdirSync } from 'fs'
import path from 'path'
import treeKill from 'tree-kill'

const isWindows = process.platform === 'win32'

const registeredHandlers = new Set<string>()

type DownloadTask = {
  videoProcess?: ReturnType<typeof spawn>
  audioProcess?: ReturnType<typeof spawn>
  filename: string
  outputPath: string
}
const downloadProcesses = new Map<string, DownloadTask>()

/**
 * ms 단위로 대기하는 Promise 반환
 * @param ms 대기 시간 (ms)
 * @returns Promise
 */
const wait = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms))

/**
 * yt-dlp 바이너리 경로를 찾는 함수
 * @returns yt-dlp 바이너리 경로
 */
function locateYtDlp(): string {
  const binaryName = isWindows ? `yt-dlp.exe` : 'yt-dlp'

  let resolvedPath: string

  if (!app.isPackaged) {
    resolvedPath = path.resolve(__dirname, '../../bin', binaryName)
    log.info('[dev] binary path:', resolvedPath)
  } else {
    resolvedPath = path.resolve(process.resourcesPath, 'bin', binaryName)
    log.info('[prod] binary path:', resolvedPath)
  }

  if (!fs.existsSync(resolvedPath)) {
    log.warn(`[locateYtDlp] Binary not found at: ${resolvedPath}`)
  }

  return resolvedPath
}

/**
 * ffmpeg 바이너리 경로를 찾는 함수
 * @returns ffmpeg 바이너리 경로
 */
function locateFfmpeg(): string {
  const ffmpeg = isWindows ? 'ffmpeg.exe' : 'ffmpeg'
  let resolvedPath: string

  if (!app.isPackaged) {
    resolvedPath = ffmpegStatic as string
    log.info('[prod] ffmpeg path:', resolvedPath)
  } else {
    resolvedPath = path.join(process.resourcesPath, 'bin', ffmpeg)
    log.info('[dev] ffmpeg path:', resolvedPath)
  }
  if (!fs.existsSync(resolvedPath)) {
    log.warn(`[locateFfmpeg] ffmpeg not found at: ${resolvedPath}`)
  }
  return resolvedPath
}

/**
 * IPC 핸들러 등록
 * @param channel
 * @param handler
 * @returns
 */
function safeSetHandler(channel: string, handler: Parameters<typeof ipcMain.handle>[1]): void {
  if (registeredHandlers.has(channel)) {
    log.warn(`[${channel}] already registered, skipping`)
    return
  }
  ipcMain.handle(channel, handler)
  registeredHandlers.add(channel)
}

/**
 * 다운로드 진행률을 메인 윈도우에 전송
 * @param mainWindow 메인 윈도우
 * @param current 다운로드 타입 (video/audio)
 * @param text yt-dlp 출력 텍스트
 */
function sendProgress(
  mainWindow: BrowserWindow,
  current: 'video' | 'audio' | 'complete' | 'init' | null,
  url: string,
  text: string
): void {
  const match = text.match(/\[download\]\s+(\d{1,3}\.\d)%/)
  if (match) {
    const percent = Math.round(parseFloat(match[1]))
    log.info(`[${current}] download progress: ${percent}%`)
    mainWindow.webContents.send('download-progress', { url, current, percent })
  }
}

/**
 * 다운로드 핸들러
 * @param mainWindow 메인 윈도우
 */
export const downloadHandler = (mainWindow: BrowserWindow): void => {
  safeSetHandler('download-dir-open', async () => {
    const downloadDir = path.join(app.getPath('downloads'), 'DownTube')
    if (!fs.existsSync(downloadDir)) {
      mkdirSync(downloadDir, { recursive: true })
    }
    await shell.openPath(downloadDir)
  })

  safeSetHandler('download-info', async (_, url: string) => {
    const ytDlpPath = locateYtDlp()
    return new Promise((res, rej) => {
      const args = [
        '--no-check-certificate',
        '--no-cache-dir',
        '--no-warnings',
        '--no-playlist',
        '--dump-json',
        url
      ]
      const p = spawn(ytDlpPath, args)
      let json = ''
      p.stdout.on('data', (data) => {
        json += data.toString()
      })
      p.stderr.on('data', (data) => {
        log.error('[yt-dlp stderr]', data.toString())
      })
      p.on('error', (err) => {
        log.error('[yt-dlp error]', err)
        rej(new Error(`yt-dlp spawn failed: ${err.message}`))
      })
      p.on('close', (code) => {
        if (code === 0) {
          try {
            const info: VideoInfo = JSON.parse(json) as VideoInfo
            res(info)
          } catch (e) {
            rej(new Error(`Invalid JSON from yt-dlp: ${e}`))
          }
        } else {
          rej(new Error(`yt-dlp exited with code ${code}`))
        }
      })
    })
  })

  safeSetHandler('download-video', async (_, url: string) => {
    const ffmpegPath = locateFfmpeg()
    ffmpeg.setFfmpegPath(ffmpegPath)
    log.info('ffmpeg path:', ffmpegPath)
    if (downloadProcesses.has(url)) {
      return { success: false, message: 'Already downloading' }
    }

    const ytDlpPath = locateYtDlp()
    const downloadDir = path.join(app.getPath('downloads'), 'DownTube')
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true })

    const timestamp = Math.floor(Date.now() / 1000).toString()
    const baseName = `${timestamp}_VOD`
    const videoFile = path.join(downloadDir, `${baseName}_video.%(ext)s`)
    const audioFile = path.join(downloadDir, `${baseName}_audio.%(ext)s`)
    const outputFile = path.join(downloadDir, `${baseName}.mkv`)

    const task: DownloadTask = {
      filename: baseName,
      outputPath: downloadDir
    }
    downloadProcesses.set(url, task)

    await new Promise<void>((res, rej) => {
      const args = [
        '--no-playlist',
        '--format',
        'bv*',
        '--no-part',
        '--restrict-filenames',
        '--output',
        videoFile,
        url
      ]
      const videoProc = spawn(ytDlpPath, args)
      task.videoProcess = videoProc

      videoProc.on('close', (code) => (code === 0 ? res() : rej(`video download failed: ${code}`)))
      videoProc.stdout.on('data', (data) => {
        sendProgress(mainWindow, 'video', url, data.toString())
      })
      videoProc.on('error', (err) => rej(err))
    })

    await new Promise<void>((res, rej) => {
      const args = [
        '--no-playlist',
        '--format',
        'ba',
        '--no-part',
        '--restrict-filenames',
        '--output',
        audioFile,
        url
      ]
      const audioProc = spawn(ytDlpPath, args)
      task.audioProcess = audioProc

      audioProc.on('close', (code) => (code === 0 ? res() : rej(`audio download failed: ${code}`)))
      audioProc.stdout.on('data', (data) => {
        sendProgress(mainWindow, 'audio', url, data.toString())
      })
      audioProc.on('error', (err) => rej(err))
    })

    return new Promise((resolve, reject) => {
      const mergedVideo = videoFile.replace('%(ext)s', 'mp4')
      const mergedAudio = audioFile.replace('%(ext)s', 'webm')
      ffmpeg(mergedVideo)
        .input(mergedAudio)
        .outputOptions('-c copy')
        .save(outputFile)
        .on('end', () => {
          log.info('[ffmpeg] Merging completed')
          fs.unlinkSync(mergedVideo)
          fs.unlinkSync(mergedAudio)
          downloadProcesses.delete(url)
          mainWindow.webContents.send('download-done', { url, file: outputFile })
          resolve({ success: true })
        })
        .on('error', (err) => {
          log.error('[ffmpeg error]', err)
          downloadProcesses.delete(url)
          reject({ success: false, message: err.message })
        })
    })
  })

  safeSetHandler('download-stop', async (_, url: string) => {
    try {
      const task = downloadProcesses.get(url)
      if (!task) {
        return { success: false, message: 'No download task found' }
      }

      if (task.videoProcess && !task.videoProcess.killed && task.videoProcess.pid) {
        treeKill(task.videoProcess.pid, 'SIGKILL', (err) => {
          if (err) {
            log.error(`[ERROR] Failed to kill video process: ${err.message}`)
          } else {
            log.info(`[INFO] Killed video process for ${url}`)
          }
        })
      }

      if (task.audioProcess && !task.audioProcess.killed && task.audioProcess.pid) {
        treeKill(task.audioProcess.pid, 'SIGKILL', (err) => {
          if (err) {
            log.error(`[ERROR] Failed to kill audio process: ${err.message}`)
          } else {
            log.info(`[INFO] Killed audio process for ${url}`)
          }
        })
      }

      downloadProcesses.delete(url)
      await wait(1000)

      const { filename, outputPath } = task
      const files = await fs.promises.readdir(outputPath)
      for (const file of files) {
        if (file.startsWith(filename)) {
          const filePath = path.join(outputPath, file)
          try {
            await fs.promises.unlink(filePath)
            log.info(`[INFO] Deleted: ${filePath}`)
          } catch (err) {
            log.error(`[ERROR] Failed to delete: ${filePath}`, err)
          }
        }
      }
      return { success: true }
    } catch (error) {
      log.error('Error stopping download:', error)
      return { success: false, message: 'Failed to stop download' }
    }
  })
}
