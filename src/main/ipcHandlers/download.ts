import { VideoInfo } from '@src/types/video-info.types'
import { spawn } from 'child_process'
import { BrowserWindow, ipcMain, shell } from 'electron'
import { app } from 'electron'
import fs, { mkdirSync } from 'fs'
import path from 'path'

const isWindows = process.platform === 'win32'

type DownloadTask = {
  process: ReturnType<typeof spawn>
  filename: string
  outputPath: string
}

const downloadProcesses = new Map<string, DownloadTask>()

/**
 * yt-dlp, ffmpeg 등 실행 파일 경로 반환
 * @param filename 실행 파일명 (확장자 제외)
 * @returns 실행 가능한 절대 경로
 */
export function locateBinary(filename: string): string {
  const binaryName = isWindows ? `${filename}.exe` : filename

  let resolvedPath: string

  if (!app.isPackaged) {
    resolvedPath = path.resolve(__dirname, '../../bin', binaryName)
    console.log('[dev] binary path:', resolvedPath)
  } else {
    resolvedPath = path.resolve(process.resourcesPath, 'bin', binaryName)
    console.log('[prod] binary path:', resolvedPath)
  }

  if (!fs.existsSync(resolvedPath)) {
    console.warn(`[locateBinary] Binary not found at: ${resolvedPath}`)
  }

  return resolvedPath
}

/**
 * 다운로드 핸들러
 * @param mainWindow 메인 윈도우
 */
export const downloadHandler = (mainWindow: BrowserWindow): void => {
  ipcMain.handle('download-dir-open', async () => {
    const downloadDir = path.join(app.getPath('downloads'), 'DownTube')
    if (!fs.existsSync(downloadDir)) {
      mkdirSync(downloadDir, { recursive: true })
    }
    await shell.openPath(downloadDir)
  })

  ipcMain.handle('download-info', async (_, url: string) => {
    const ytDlpPath = locateBinary('yt-dlp')
    return new Promise((resolve, reject) => {
      const args = [
        '--no-check-certificate',
        '--no-cache-dir',
        '--no-warnings',
        '--no-playlist',
        '--dump-json',
        url
      ]
      const child = spawn(ytDlpPath, args)
      let json = ''
      child.stdout.on('data', (data) => {
        json += data.toString()
      })
      child.stderr.on('data', (data) => {
        console.error('[yt-dlp stderr]', data.toString())
      })
      child.on('error', (err) => {
        console.error('[yt-dlp error]', err)
        reject(new Error(`yt-dlp spawn failed: ${err.message}`))
      })
      child.on('close', (code) => {
        if (code === 0) {
          try {
            const info: VideoInfo = JSON.parse(json) as VideoInfo
            resolve(info)
          } catch (e) {
            reject(new Error(`Invalid JSON from yt-dlp: ${e}`))
          }
        } else {
          reject(new Error(`yt-dlp exited with code ${code}`))
        }
      })
    })
  })

  ipcMain.handle('download-video', async (_, url: string) => {
    if (downloadProcesses.has(url)) {
      return { success: false, message: 'Already downloading' }
    }
    const ffmpegPath = locateBinary('ffmpeg')
    const ytDlpPath = locateBinary('yt-dlp')

    const downloadDir = path.join(app.getPath('downloads'), 'DownTube')
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true })
    }

    return new Promise((resolve, reject) => {
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const filename = `${timestamp}_VOD`
      const args = [
        '--no-cache-dir',
        '--no-warnings',
        '--no-check-certificate',
        '--no-playlist',
        '--format',
        'bv*+ba/best',
        '--merge-output-format',
        'mkv',
        '--ffmpeg-location',
        path.dirname(ffmpegPath),
        '--no-part',
        '--restrict-filenames',
        '--output',
        path.join(downloadDir, `${filename}.%(ext)s`),
        url
      ]

      const child = spawn(ytDlpPath, args)
      downloadProcesses.set(url, { process: child, filename: filename, outputPath: downloadDir })

      child.stdout.on('data', (data) => {
        const text = data.toString()
        console.log('yt-dlp stdout:', text)
        const match = text.match(/\[download\]\s+(\d{1,3}\.\d)%/)
        if (match) {
          const percent = Math.round(parseFloat(match[1]))
          mainWindow.webContents.send('download-progress', { url, percent })
        }
      })

      child.on('error', (err) => {
        console.error('[yt-dlp spawn error]', err)
        reject({ success: false, message: `yt-dlp spawn failed: ${err.message}` })
      })

      child.on('close', (code) => {
        console.log('yt-dlp process exited with code:', code)
        if (code === 0) {
          mainWindow.webContents.send('download-done', { url })
          resolve({ success: true })
        } else {
          reject({ success: false, message: `yt-dlp exited with code ${code}` })
        }
      })
    })
  })

  ipcMain.handle('download-stop', async (_, url: string) => {
    try {
      const task = downloadProcesses.get(url)
      if (!task) {
        return { success: false, message: 'No download process found' }
      }
      const { filename, outputPath } = task
      const files = await fs.promises.readdir(outputPath)
      for (const file of files) {
        if (file.startsWith(filename)) {
          const filePath = path.join(outputPath, file)
          try {
            await fs.promises.unlink(filePath)
            console.log(`[INFO] Deleted: ${filePath}`)
          } catch (err) {
            console.error(`[ERROR] Failed to delete: ${filePath}`, err)
          }
        }
      }
      task.process.kill()
      downloadProcesses.delete(url)
      return { success: true }
    } catch (error) {
      console.error('Error stopping download:', error)
      return { success: false, message: 'Failed to stop download' }
    }
  })
}
