export function getPlayerSearchParamsFromHash(hash: string): URLSearchParams {
  return new URLSearchParams(hash.split('?')[1] || '')
}

export function getDecodedVideoSrc(rawVideoSrc: string): string {
  if (!rawVideoSrc) return ''
  try {
    return decodeURIComponent(rawVideoSrc)
  } catch {
    return rawVideoSrc
  }
}

export function getFileNameFromVideoSrc(videoSrc: string): string {
  if (!videoSrc) return ''
  try {
    const url = new URL(videoSrc)
    const path = url.searchParams.get('path') ?? ''
    if (!path) return ''
    const decodedPath = decodeURIComponent(path)
    const segments = decodedPath.split('/').filter(Boolean)
    return segments[segments.length - 1] ?? ''
  } catch {
    return ''
  }
}

export function getMediaPathFromVideoSrc(videoSrc: string): string {
  if (!videoSrc) return ''
  try {
    const url = new URL(videoSrc)
    const path = url.searchParams.get('path') ?? ''
    return path ? decodeURIComponent(path) : ''
  } catch {
    return ''
  }
}

export function getFileExtension(fileName: string): string {
  if (!fileName.includes('.')) return ''
  return fileName.split('.').pop()?.toUpperCase() ?? ''
}

export function getFileNameWithoutExtension(fileName: string): string {
  if (!fileName.includes('.')) return fileName
  return fileName.slice(0, fileName.lastIndexOf('.'))
}
