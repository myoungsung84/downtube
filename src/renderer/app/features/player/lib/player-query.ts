export function getPlayerSearchParamsFromHash(hash: string): URLSearchParams {
  return new URLSearchParams(hash.split('?')[1] || '')
}

export function getPlayerPathsFromHash(hash: string): string[] {
  const rawPaths = getPlayerSearchParamsFromHash(hash).get('paths') ?? ''
  if (!rawPaths) return []

  try {
    const parsed = JSON.parse(rawPaths) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((candidate): candidate is string => typeof candidate === 'string')
  } catch {
    return []
  }
}

export function getFileNameFromPath(filePath: string): string {
  if (!filePath) return ''
  const segments = filePath.split(/[\\/]/).filter(Boolean)
  return segments[segments.length - 1] ?? ''
}

export function getFileExtension(fileName: string): string {
  if (!fileName.includes('.')) return ''
  return fileName.split('.').pop()?.toUpperCase() ?? ''
}

export function getFileNameWithoutExtension(fileName: string): string {
  if (!fileName.includes('.')) return fileName
  return fileName.slice(0, fileName.lastIndexOf('.'))
}
