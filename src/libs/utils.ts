export function youtubeIdFromUrl(url: string): string | '' {
  const regex = /(?:youtube\.com\/(?:.*v=|.*\/shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const match = url.match(regex)
  if (match) return match[1]

  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v') ?? ''
    }
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.replace('/', '')
    }
  } catch {
    console.error('Invalid URL:', url)
  }
  return ''
}

export function secondToTime(seconds?: number): string {
  if (seconds === undefined || seconds < 0) return '0초'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const parts: string[] = []
  if (h > 0) parts.push(`${h}시간`)
  if (m > 0) parts.push(`${m}분`)
  if (s > 0 || parts.length === 0) parts.push(`${s}초`)
  return parts.join(' ')
}

export function numberToFormat(num?: number | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0'
  return num.toLocaleString('ko-KR')
}

export function formatCompactNumber(count?: number | null): string {
  if (count === undefined || count === null || isNaN(count)) return '0'

  const abs = Math.abs(count)

  if (abs < 1000) return `${count}`
  if (abs < 1_000_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  if (abs < 1_000_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  return `${(count / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`
}
