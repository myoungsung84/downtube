import type { AppError, AppErrorCode, AppResult } from '../../types/error.types'

const TIMEOUT_PATTERNS = ['timed out', 'timeout', 'etimedout', 'aborterror']
const NETWORK_PATTERNS = [
  'network',
  'connection',
  'econnreset',
  'enotfound',
  'failed to fetch',
  'socket hang up'
]
const ACCESS_DENIED_PATTERNS = ['access denied', 'permission denied', 'eacces', 'eperm']
const FILE_NOT_FOUND_PATTERNS = ['file not found', 'no such file', 'enoent']

function includesAny(input: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => input.includes(pattern))
}

export function getErrorDetail(error: unknown): string | undefined {
  if (error instanceof Error) {
    const detail = error.message.trim()
    return detail || undefined
  }

  if (typeof error === 'string') {
    const detail = error.trim()
    return detail || undefined
  }

  if (error == null) {
    return undefined
  }

  try {
    const detail = JSON.stringify(error)
    return detail === '{}' ? undefined : detail
  } catch {
    return String(error)
  }
}

export function resolveCommonErrorCode(
  detail: string | undefined,
  fallbackCode: AppErrorCode
): AppErrorCode {
  if (!detail) {
    return fallbackCode
  }

  const normalized = detail.toLowerCase()

  if (includesAny(normalized, TIMEOUT_PATTERNS)) {
    return 'common.timeout'
  }

  if (includesAny(normalized, NETWORK_PATTERNS)) {
    return 'common.network'
  }

  if (includesAny(normalized, ACCESS_DENIED_PATTERNS)) {
    return 'common.access_denied'
  }

  if (includesAny(normalized, FILE_NOT_FOUND_PATTERNS)) {
    return 'common.file_not_found'
  }

  return fallbackCode
}

export function createAppError(code: AppErrorCode, detail?: string): AppError {
  return {
    code,
    ...(detail ? { detail } : {})
  }
}

export function normalizeUnknownAppError(fallbackCode: AppErrorCode, error: unknown): AppError {
  const detail = getErrorDetail(error)
  return createAppError(resolveCommonErrorCode(detail, fallbackCode), detail)
}

export function successResult<T extends object = Record<never, never>>(payload?: T): AppResult<T> {
  if (!payload) {
    return { success: true } as AppResult<T>
  }

  return { success: true, ...payload }
}

export function failureResult<T extends object = Record<never, never>>(
  code: AppErrorCode,
  detail?: string
): AppResult<T> {
  return {
    success: false,
    error: createAppError(code, detail)
  }
}

export function failureFromUnknown<T extends object = Record<never, never>>(
  fallbackCode: AppErrorCode,
  error: unknown
): AppResult<T> {
  return {
    success: false,
    error: normalizeUnknownAppError(fallbackCode, error)
  }
}
