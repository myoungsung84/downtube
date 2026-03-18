import { SvgIconComponent } from '@mui/icons-material'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DownloadingIcon from '@mui/icons-material/Downloading'
import ErrorIcon from '@mui/icons-material/Error'
import ScheduleIcon from '@mui/icons-material/Schedule'
import type { DownloadJob } from '@src/types/download.types'
import type { RecentUrlHistoryItem } from '@src/types/settings.types'
import clamp from 'lodash/clamp'
import isNil from 'lodash/isNil'
import orderBy from 'lodash/orderBy'
import uniqBy from 'lodash/uniqBy'

export function isPlaylistUrl(input: string): boolean {
  try {
    const u = new URL(input)
    return Boolean(u.searchParams.get('list'))
  } catch {
    return /[?&]list=/.test(input)
  }
}

export function isYoutubeUrl(input: string): boolean {
  const trimmed = input.trim()

  if (!trimmed) {
    return false
  }

  const candidates: string[] = [trimmed]

  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)
  if (!hasScheme) {
    candidates.push(`https://${trimmed}`)
  }

  for (const candidate of candidates) {
    try {
      const url = new URL(candidate)
      const host = url.hostname.toLowerCase()

      if (
        host === 'youtube.com' ||
        host === 'www.youtube.com' ||
        host === 'm.youtube.com' ||
        host === 'music.youtube.com' ||
        host === 'youtu.be' ||
        host.endsWith('.youtube.com')
      ) {
        return true
      }
    } catch {
      // 파싱 실패 시 다음 후보 또는 정규식 보완으로 넘어갑니다.
    }
  }

  // URL 파싱이 모두 실패한 경우, 유효하지 않은 입력으로 간주합니다.
  return false
}

export function paletteMain(
  color: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
): string {
  // MUI palette에는 default.main 없음
  if (color === 'default') return 'text.secondary'
  return `${color}.main`
}

export function resolveDownloadStatus(status: DownloadJob['status']): {
  labelKey: string
  color: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
  icon: SvgIconComponent
} {
  switch (status) {
    case 'queued':
      return {
        labelKey: 'job.status.queued',
        color: 'default',
        icon: ScheduleIcon
      }

    case 'running':
      return {
        labelKey: 'job.status.running',
        color: 'info',
        icon: DownloadingIcon
      }

    case 'completed':
      return {
        labelKey: 'job.status.completed',
        color: 'success',
        icon: CheckCircleIcon
      }

    case 'failed':
      return {
        labelKey: 'job.status.failed',
        color: 'error',
        icon: ErrorIcon
      }

    case 'cancelled':
      return {
        labelKey: 'job.status.cancelled',
        color: 'warning',
        icon: CancelIcon
      }

    default:
      return {
        labelKey: 'job.status.queued',
        color: 'default',
        icon: ScheduleIcon
      }
  }
}

export function formatPercent(p: number | undefined): string {
  if (isNil(p) || Number.isNaN(p)) return '0%'
  const v = clamp(p, 0, 100)
  return `${v.toFixed(1)}%`
}

export function inferTitle(job: DownloadJob): string {
  return job.info?.title || job.filename || job.url
}

export function sortJobs(jobs: DownloadJob[]): DownloadJob[] {
  return orderBy(jobs, [(job) => job.createdAt ?? 0], ['asc'])
}

export function normalizeRecentUrlHistory(
  value: unknown,
  isPlaylist: (input: string) => boolean,
  getFallbackTitle: (kind: RecentUrlHistoryItem['kind']) => string
): RecentUrlHistoryItem[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (typeof item === 'string') {
      const url = item.trim()
      if (!url) return []

      const kind: RecentUrlHistoryItem['kind'] = isPlaylist(url) ? 'playlist' : 'single'
      return [{ url, kind, title: getFallbackTitle(kind) }]
    }

    if (typeof item !== 'object' || isNil(item)) return []
    if (typeof item.url !== 'string' || typeof item.title !== 'string') return []
    if (item.kind !== 'single' && item.kind !== 'playlist') return []

    const url = item.url.trim()
    const title = item.title.trim()
    if (!url) return []

    return [
      {
        url,
        title: title || getFallbackTitle(item.kind),
        kind: item.kind
      }
    ]
  })
}

export function updateRecentUrlHistory(
  prev: RecentUrlHistoryItem[],
  nextItem: RecentUrlHistoryItem,
  getFallbackTitle: (kind: RecentUrlHistoryItem['kind']) => string,
  limit = 10
): RecentUrlHistoryItem[] {
  const url = nextItem.url.trim()
  const title = nextItem.title.trim()
  if (!url) return prev

  return [
    ...uniqBy(
      [
        {
          url,
          title: title || getFallbackTitle(nextItem.kind),
          kind: nextItem.kind
        },
        ...prev
      ],
      'url'
    )
  ].slice(0, limit)
}

export function updateRecentUrlHistoryTitle(
  prev: RecentUrlHistoryItem[],
  url: string,
  title: string
): RecentUrlHistoryItem[] {
  const normalizedUrl = url.trim()
  const normalizedTitle = title.trim()
  if (!normalizedUrl || !normalizedTitle) return prev

  let changed = false
  const next = prev.map((item) => {
    if (item.url !== normalizedUrl) return item
    if (item.title === normalizedTitle) return item
    changed = true
    return { ...item, title: normalizedTitle }
  })

  return changed ? next : prev
}

export function formatDuration(durationSec: number | undefined): string | undefined {
  if (isNil(durationSec) || !Number.isFinite(durationSec) || durationSec < 0) return undefined
  const m = Math.floor(durationSec / 60)
  const s = Math.floor(durationSec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function statusTone(status: DownloadJob['status']): {
  borderColor: string
  tone: 'neutral' | 'running' | 'completed' | 'failed' | 'cancelled'
  chipColor: 'default' | 'success' | 'error' | 'warning' | 'info'
  bgPaletteKey: 'primary' | 'success' | 'error' | 'warning' | null
} {
  switch (status) {
    case 'running':
      return {
        borderColor: 'primary.main',
        tone: 'running',
        chipColor: 'info',
        bgPaletteKey: 'primary'
      }
    case 'completed':
      return {
        borderColor: 'success.main',
        tone: 'completed',
        chipColor: 'success',
        bgPaletteKey: 'success'
      }
    case 'failed':
      return {
        borderColor: 'error.main',
        tone: 'failed',
        chipColor: 'error',
        bgPaletteKey: 'error'
      }
    case 'cancelled':
      return {
        borderColor: 'warning.main',
        tone: 'cancelled',
        chipColor: 'warning',
        bgPaletteKey: 'warning'
      }
    case 'queued':
    default:
      return { borderColor: 'divider', tone: 'neutral', chipColor: 'default', bgPaletteKey: null }
  }
}

export function getErrorMessage(error: string | undefined): {
  titleKey: string
  descriptionKey?: string
  descriptionFallback?: string
} {
  if (!error) {
    return { titleKey: 'errors.unknown.title', descriptionKey: 'errors.unknown.description' }
  }

  const lowerError = error.toLowerCase()

  if (lowerError.includes('network') || lowerError.includes('connection')) {
    return { titleKey: 'errors.network.title', descriptionKey: 'errors.network.description' }
  }

  if (lowerError.includes('not found') || lowerError.includes('404')) {
    return { titleKey: 'errors.not_found.title', descriptionKey: 'errors.not_found.description' }
  }

  if (lowerError.includes('private') || lowerError.includes('unavailable')) {
    return {
      titleKey: 'errors.unavailable.title',
      descriptionKey: 'errors.unavailable.description'
    }
  }

  return {
    titleKey: 'errors.download_failed.title',
    descriptionFallback: error.length > 100 ? error.slice(0, 100) + '...' : error
  }
}
