import type { AppError } from '../../../types/error.types'
import { createAppError, getErrorDetail, resolveCommonErrorCode } from '../../common/app-error'

const INVALID_URL_PATTERNS = ['invalid url', 'invalid playlisturl', 'unsupported url']
const PRIVATE_VIDEO_PATTERNS = ['private video', 'this video is private']
const AGE_RESTRICTED_PATTERNS = ['sign in to confirm your age', 'age-restricted', 'age restricted']
const VIDEO_UNAVAILABLE_PATTERNS = [
  'video unavailable',
  'requested format is not available',
  'not available in your country',
  'this video is unavailable'
]

function includesAny(input: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => input.includes(pattern))
}

export function normalizeDownloadsError(error: unknown): AppError {
  const detail = getErrorDetail(error)

  if (!detail) {
    return createAppError('downloads.download_failed')
  }

  const normalized = detail.toLowerCase()

  if (includesAny(normalized, INVALID_URL_PATTERNS)) {
    return createAppError('downloads.invalid_url', detail)
  }

  if (includesAny(normalized, PRIVATE_VIDEO_PATTERNS)) {
    return createAppError('downloads.private_video', detail)
  }

  if (includesAny(normalized, AGE_RESTRICTED_PATTERNS)) {
    return createAppError('downloads.age_restricted', detail)
  }

  if (includesAny(normalized, VIDEO_UNAVAILABLE_PATTERNS)) {
    return createAppError('downloads.video_unavailable', detail)
  }

  return createAppError(resolveCommonErrorCode(detail, 'downloads.download_failed'), detail)
}
