//import { locateBinary } from '../utils/locateBinary'
import { spawn } from 'child_process'
import { BrowserWindow, ipcMain } from 'electron'
import { app } from 'electron'
import fs from 'fs'
import path from 'path'

import { locateBinary } from '@libs/utils'

export const downloadHandler = (mainWindow: BrowserWindow): void => {
  ipcMain.handle('download-video', async (event, url: string) => {
    console.log('event:', event)
    const ffmpegPath = locateBinary('ffmpeg')
    const ytDlpPath = locateBinary('yt-dlp')

    const downloadDir = path.join(app.getPath('downloads'), 'DownTube')
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true })
    }

    return new Promise((resolve, reject) => {
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
        path.join(downloadDir, '%(title).60s.%(ext)s'),
        url
      ]
      const child = spawn(ytDlpPath, args)
      child.stdout.on('data', (data) => {
        const text = data.toString()
        console.log('yt-dlp stdout:', text)
        const match = text.match(/\[download\]\s+(\d{1,3}\.\d)%/)
        if (match) {
          const percent = parseFloat(match[1])
          console.log('Download progress:', percent)
          mainWindow.webContents.send('download-progress', { url, percent })
        }
      })
      child.on('error', (err) => {
        console.error('[yt-dlp spawn error]', err)
        reject(new Error(`yt-dlp spawn failed: ${err.message}`))
      })

      child.on('close', (code) => {
        console.log('yt-dlp process exited with code:', code)
        if (code === 0) {
          resolve({ success: true })
        } else {
          reject(new Error(`yt-dlp exited with code ${code}`))
        }
      })
    })
  })
}
