import type { DownloadJob } from '@src/types/download.types'

export function isPlaylistUrl(input: string): boolean {
  try {
    const u = new URL(input)
    return Boolean(u.searchParams.get('list'))
  } catch {
    return /[?&]list=/.test(input)
  }
}

export function statusLabel(status: DownloadJob['status']): string {
  switch (status) {
    case 'queued':
      return '대기중'
    case 'running':
      return '다운로드중'
    case 'completed':
      return '완료'
    case 'failed':
      return '실패'
    case 'cancelled':
      return '취소됨'
    default:
      return status
  }
}

export function formatPercent(p: number | undefined): string {
  if (p == null || Number.isNaN(p)) return '0%'
  const v = Math.max(0, Math.min(100, p))
  return `${v.toFixed(1)}%`
}

export function inferTitle(job: DownloadJob): string {
  return job.info?.title || job.filename || job.url
}

export function sortJobs(jobs: DownloadJob[]): DownloadJob[] {
  return [...jobs].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
}

export function formatDuration(durationSec: number | undefined): string | undefined {
  if (durationSec == null || !Number.isFinite(durationSec) || durationSec < 0) return undefined
  const m = Math.floor(durationSec / 60)
  const s = Math.floor(durationSec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function statusTone(status: DownloadJob['status']): {
  borderColor?: string
  bg?: string
  chipColor?: 'default' | 'success' | 'error' | 'warning' | 'info'
} {
  switch (status) {
    case 'running':
      return { borderColor: 'primary.main', bg: 'action.hover', chipColor: 'info' }
    case 'completed':
      return { borderColor: 'success.main', bg: 'rgba(46, 125, 50, 0.08)', chipColor: 'success' }
    case 'failed':
      return { borderColor: 'error.main', bg: 'rgba(211, 47, 47, 0.08)', chipColor: 'error' }
    case 'cancelled':
      return { borderColor: 'warning.main', bg: 'rgba(237, 108, 2, 0.08)', chipColor: 'warning' }
    case 'queued':
    default:
      return { borderColor: 'divider', bg: 'transparent', chipColor: 'default' }
  }
}

export function getErrorMessage(error: string | undefined): { title: string; description: string } {
  if (!error) return { title: '알 수 없는 오류', description: '다시 시도해주세요.' }

  const lowerError = error.toLowerCase()

  if (lowerError.includes('network') || lowerError.includes('connection')) {
    return { title: '인터넷 연결 문제', description: '인터넷 연결을 확인하고 다시 시도해주세요.' }
  }

  if (lowerError.includes('not found') || lowerError.includes('404')) {
    return { title: '영상을 찾을 수 없음', description: '삭제되었거나 비공개 영상일 수 있어요.' }
  }

  if (lowerError.includes('private') || lowerError.includes('unavailable')) {
    return { title: '접근할 수 없는 영상', description: '비공개 또는 지역 제한 영상이에요.' }
  }

  return {
    title: '다운로드 실패',
    description: error.length > 100 ? error.slice(0, 100) + '...' : error
  }
}
