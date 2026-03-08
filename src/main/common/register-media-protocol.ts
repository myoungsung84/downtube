import { app, net, protocol } from 'electron'
import fs from 'fs'
import { extname } from 'path'
import { pathToFileURL } from 'url'

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
    return mediaPath
  } catch {
    return null
  }
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

    const fileUrl = pathToFileURL(mediaPath).toString()
    const upstream = await net.fetch(fileUrl, {
      method: request.method,
      headers: request.headers
    })

    const headers = new Headers(upstream.headers)
    headers.set('content-type', guessMimeType(mediaPath))

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers
    })
  })
}
