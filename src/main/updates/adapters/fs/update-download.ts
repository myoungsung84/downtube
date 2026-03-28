import axios from 'axios'
import fs from 'fs'
import path from 'path'

import { removePathBestEffort, removePathWithRetry } from './update-fs'

type DownloadUpdateAssetParams = {
  assetUrl: string
  zipPath: string
  onStart?: (payload: { totalBytes: number | null }) => void
  onProgress?: (payload: {
    downloadedBytes: number
    totalBytes: number | null
    percent: number | null
  }) => void
}

function parseContentLength(value: unknown): number | null {
  if (typeof value !== 'string') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export async function downloadUpdateAsset({
  assetUrl,
  zipPath,
  onStart,
  onProgress
}: DownloadUpdateAssetParams): Promise<void> {
  await fs.promises.mkdir(path.dirname(zipPath), { recursive: true })
  await removePathWithRetry(zipPath, { force: true })

  try {
    const response = await axios.get<NodeJS.ReadableStream>(assetUrl, {
      responseType: 'stream',
      headers: {
        Accept: 'application/octet-stream',
        'User-Agent': 'Downtube'
      }
    })

    const totalBytes = parseContentLength(response.headers['content-length'])
    onStart?.({ totalBytes })

    await new Promise<void>((resolve, reject) => {
      const responseStream = response.data as NodeJS.ReadableStream & {
        destroy: (error?: Error) => void
      }
      const writer = fs.createWriteStream(zipPath)
      let downloadedBytes = 0
      let settled = false

      const fail = (error: unknown): void => {
        if (settled) {
          return
        }

        settled = true
        responseStream.destroy()
        writer.destroy()
        reject(error)
      }

      responseStream.on('data', (chunk: Buffer) => {
        downloadedBytes += chunk.length

        onProgress?.({
          downloadedBytes,
          totalBytes,
          percent: totalBytes
            ? Math.min(100, Math.round((downloadedBytes / totalBytes) * 100))
            : null
        })
      })

      responseStream.on('error', fail)
      writer.on('error', fail)
      writer.on('finish', () => {
        if (settled) {
          return
        }

        settled = true
        resolve()
      })
      responseStream.pipe(writer)
    })
  } catch (error) {
    await removePathBestEffort(zipPath, { force: true })
    throw error
  }
}
