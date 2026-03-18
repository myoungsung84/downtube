export function toMediaUrl(filePath?: string): string | undefined {
  if (!filePath) return undefined
  const url = new URL('downtube-media://media')
  url.searchParams.set('path', filePath)
  return url.toString()
}
