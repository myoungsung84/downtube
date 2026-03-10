import { app, protocol } from 'electron'
import fs from 'fs'
import { extname, resolve, sep } from 'path'
import { Readable } from 'stream'

const MEDIA_SCHEME = 'downtube-media'

protocol.registerSchemesAsPrivileged([
  {
    scheme: MEDIA_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
])

function guessMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase()
  if (ext === '.mkv') return 'video/x-matroska'
  if (ext === '.mp4') return 'video/mp4'
  if (ext === '.webm') return 'video/webm'
  if (ext === '.mp3') return 'audio/mpeg'
  if (ext === '.m4a') return 'audio/mp4'
  return 'application/octet-stream'
}

function resolveMediaPath(requestUrl: string): string | null {
  try {
    const parsed = new URL(requestUrl)
    const mediaPath = parsed.searchParams.get('path')
    if (!mediaPath) return null
    const resolvedPath = resolve(mediaPath)
    const allowedDir = resolve(app.getPath('downloads'))
    const normalizedResolved =
      process.platform === 'win32' ? resolvedPath.toLowerCase() : resolvedPath
    const normalizedAllowed =
      process.platform === 'win32' ? allowedDir.toLowerCase() : allowedDir
    if (!normalizedResolved.startsWith(normalizedAllowed + sep)) {
      return null
    }
    try {
      return fs.realpathSync(resolvedPath)
    } catch {
      return null
    }
  } catch {
    return null
  }
}

type ParsedRange = { start: number; end: number }
type ParseRangeResult = ParsedRange | null | 'invalid'

function parseRangeHeader(rangeHeader: string | null, fileSize: number): ParseRangeResult {
  if (!rangeHeader) return null

  const normalized = rangeHeader.trim()
  if (!normalized.startsWith('bytes=')) return 'invalid'

  const rangeValue = normalized.slice('bytes='.length).trim()
  if (!rangeValue || rangeValue.includes(',')) return 'invalid'

  const [rawStart, rawEnd] = rangeValue.split('-', 2)
  if (rawStart === undefined || rawEnd === undefined) return 'invalid'

  if (rawStart === '') {
    const suffixLength = Number(rawEnd)
    if (!Number.isInteger(suffixLength) || suffixLength <= 0) return 'invalid'

    const start = Math.max(fileSize - suffixLength, 0)
    const end = fileSize - 1
    if (start > end || start >= fileSize) return 'invalid'
    return { start, end }
  }

  const start = Number(rawStart)
  if (!Number.isInteger(start) || start < 0) return 'invalid'
  if (start >= fileSize) return 'invalid'

  if (rawEnd === '') {
    const end = fileSize - 1
    if (start > end) return 'invalid'
    return { start, end }
  }

  const requestedEnd = Number(rawEnd)
  if (!Number.isInteger(requestedEnd) || requestedEnd < 0) return 'invalid'

  const end = Math.min(requestedEnd, fileSize - 1)
  if (start > end) return 'invalid'

  return { start, end }
}

function createFileBodyStream(mediaPath: string, start?: number, end?: number): BodyInit {
  const stream = fs.createReadStream(mediaPath, {
    start,
    end
  })
  return Readable.toWeb(stream) as unknown as BodyInit
}

export function registerMediaProtocol(): void {
  protocol.handle(MEDIA_SCHEME, async (request) => {
    const mediaPath = resolveMediaPath(request.url)
    if (!mediaPath) {
      return new Response('Invalid media path', { status: 400 })
    }

    if (!app.isPackaged) {
      console.log('[media] request', request.url, mediaPath)
    }

    if (!fs.existsSync(mediaPath)) {
      return new Response('Media file not found', { status: 404 })
    }

    const { size: fileSize } = await fs.promises.stat(mediaPath)
    const mimeType = guessMimeType(mediaPath)
    const incomingRange = request.headers.get('range')
    const parsedRange = parseRangeHeader(incomingRange, fileSize)

    if (parsedRange === 'invalid') {
      if (!app.isPackaged) {
        console.log('[media] response', {
          requestUrl: request.url,
          mediaPath,
          range: incomingRange,
          resolvedRange: null,
          status: 416
        })
      }

      return new Response('Range Not Satisfiable', {
        status: 416,
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Range': `bytes */${fileSize}`,
          'Content-Type': 'text/plain; charset=utf-8'
        }
      })
    }

    if (!parsedRange) {
      if (!app.isPackaged) {
        console.log('[media] response', {
          requestUrl: request.url,
          mediaPath,
          range: incomingRange,
          resolvedRange: null,
          status: 200
        })
      }

      const headers = new Headers({
        'Accept-Ranges': 'bytes',
        'Content-Type': mimeType,
        'Content-Length': String(fileSize)
      })

      return new Response(request.method === 'HEAD' ? null : createFileBodyStream(mediaPath), {
        status: 200,
        headers
      })
    }

    const { start, end } = parsedRange
    const contentLength = end - start + 1

    if (!app.isPackaged) {
      console.log('[media] response', {
        requestUrl: request.url,
        mediaPath,
        range: incomingRange,
        resolvedRange: { start, end },
        status: 206
      })
    }

    const headers = new Headers({
      'Accept-Ranges': 'bytes',
      'Content-Type': mimeType,
      'Content-Length': String(contentLength),
      'Content-Range': `bytes ${start}-${end}/${fileSize}`
    })

    return new Response(
      request.method === 'HEAD' ? null : createFileBodyStream(mediaPath, start, end),
      {
        status: 206,
        headers
      }
    )
  })
}
