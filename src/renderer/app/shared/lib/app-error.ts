import type { AppError, AppErrorCode } from '@src/types/error.types'

import { i18n } from '../i18n/i18n'

const UNKNOWN_ERROR_KEY = 'common:errors.common.unknown'

const errorMessageKeyMap: Record<AppErrorCode, string> = {
  'common.unknown': 'common:errors.common.unknown',
  'common.network': 'common:errors.common.network',
  'common.timeout': 'common:errors.common.timeout',
  'common.invalid_request': 'common:errors.common.invalid_request',
  'common.not_found': 'common:errors.common.not_found',
  'common.file_not_found': 'common:errors.common.file_not_found',
  'common.access_denied': 'common:errors.common.access_denied',
  'common.open_failed': 'common:errors.common.open_failed',
  'downloads.invalid_url': 'common:errors.downloads.invalid_url',
  'downloads.already_in_queue': 'common:errors.downloads.already_in_queue',
  'downloads.video_unavailable': 'common:errors.downloads.video_unavailable',
  'downloads.private_video': 'common:errors.downloads.private_video',
  'downloads.age_restricted': 'common:errors.downloads.age_restricted',
  'downloads.download_failed': 'common:errors.downloads.download_failed',
  'player.open_failed': 'common:errors.player.open_failed',
  'library.delete_failed': 'common:errors.library.delete_failed',
  'updates.check_failed': 'common:errors.updates.check_failed',
  'updates.asset_not_found': 'common:errors.updates.asset_not_found',
  'updates.download_failed': 'common:errors.updates.download_failed',
  'updates.extract_failed': 'common:errors.updates.extract_failed',
  'updates.unsupported_platform': 'common:errors.updates.unsupported_platform',
  'updates.apply_not_allowed': 'common:errors.updates.apply_not_allowed',
  'updates.prepared_update_missing': 'common:errors.updates.prepared_update_missing',
  'updates.invalid_install_dir': 'common:errors.updates.invalid_install_dir',
  'updates.apply_failed': 'common:errors.updates.apply_failed',
  'init.initialization_failed': 'common:errors.init.initialization_failed'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isAppErrorCode(value: unknown): value is AppErrorCode {
  return typeof value === 'string' && Object.hasOwn(errorMessageKeyMap, value)
}

function normalizeErrorInput(error: unknown): AppError | undefined {
  if (!isRecord(error) || !isAppErrorCode(error.code)) {
    return undefined
  }

  return {
    code: error.code,
    ...(typeof error.detail === 'string' && error.detail.trim()
      ? { detail: error.detail.trim() }
      : {})
  }
}

function resolveExistingMessageKey(
  primaryKey: string | undefined,
  fallbackKey: string | undefined
): string {
  if (primaryKey && i18n.exists(primaryKey)) {
    return primaryKey
  }

  if (fallbackKey && i18n.exists(fallbackKey)) {
    return fallbackKey
  }

  return UNKNOWN_ERROR_KEY
}

export function resolveAppErrorMessage(error?: unknown, fallbackKey?: string): string {
  const normalizedError = normalizeErrorInput(error)
  const primaryKey = normalizedError ? errorMessageKeyMap[normalizedError.code] : undefined
  return i18n.t(resolveExistingMessageKey(primaryKey, fallbackKey) as never)
}

export function resolveAppErrorDetail(error: unknown): string | undefined {
  if (typeof error === 'string') {
    const detail = error.trim()
    return detail || undefined
  }

  const normalizedError = normalizeErrorInput(error)
  if (normalizedError?.detail) {
    return normalizedError.detail
  }

  if (!isRecord(error)) {
    return undefined
  }

  if (typeof error.detail === 'string') {
    const detail = error.detail.trim()
    return detail || undefined
  }

  if (typeof error.message === 'string') {
    const detail = error.message.trim()
    return detail || undefined
  }

  return undefined
}
