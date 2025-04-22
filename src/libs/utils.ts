/**
 * 유튜브 URL에서 ID를 추출하는 함수
 * @param url 유튜브 URL
 * @returns 유튜브 ID 또는 빈 문자열
 */
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

/**
 * 초를 사용자 친화적인 시:분:초 형식 문자열로 변환
 * @param seconds 초 단위 시간
 * @returns 예: "1시간 5분 32초", "2분 1초", "45초"
 */
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

/**
 * 숫자를 천 단위로 쉼표(,)를 추가한 문자열로 포맷
 * @param num 숫자
 * @returns 예: 1234567 → "1,234,567"
 */
export function numberToFormat(num?: number | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0'
  return num.toLocaleString('ko-KR')
}

/**
 * 숫자를 구글/유튜브 스타일로 축약해서 포맷
 * @param count 숫자
 * @returns 예: 1,500 → "1.5K", 1,000,000 → "1M"
 */
export function formatCompactNumber(count?: number | null): string {
  if (count === undefined || count === null || isNaN(count)) return '0'

  const abs = Math.abs(count)

  if (abs < 1000) return `${count}`
  if (abs < 1_000_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  if (abs < 1_000_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  return `${(count / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`
}
