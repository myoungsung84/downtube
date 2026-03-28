import log from 'electron-log'
import fs from 'fs'

const RETRYABLE_FS_ERROR_CODES = new Set(['EBUSY', 'EPERM', 'ENOTEMPTY'])
const DEFAULT_MAX_ATTEMPTS = 4
const DEFAULT_DELAY_MS = 150

type RetryableFsError = NodeJS.ErrnoException

type RemovePathWithRetryOptions = {
  recursive?: boolean
  force?: boolean
  maxAttempts?: number
  delayMs?: number
  swallowMissing?: boolean
}

function isRetryableFsError(error: unknown): error is RetryableFsError {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as RetryableFsError).code === 'string' &&
    RETRYABLE_FS_ERROR_CODES.has((error as RetryableFsError).code as string)
  )
}

function isMissingPathError(error: unknown): error is RetryableFsError {
  return error instanceof Error && 'code' in error && (error as RetryableFsError).code === 'ENOENT'
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function resolvePathKind(targetPath: string): Promise<'file' | 'dir' | 'other' | 'missing'> {
  try {
    const stat = await fs.promises.lstat(targetPath)
    if (stat.isDirectory()) {
      return 'dir'
    }

    if (stat.isFile()) {
      return 'file'
    }

    return 'other'
  } catch (error) {
    if (isMissingPathError(error)) {
      return 'missing'
    }

    return 'other'
  }
}

export async function removePathWithRetry(
  targetPath: string,
  {
    recursive = false,
    force = false,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    delayMs = DEFAULT_DELAY_MS,
    swallowMissing = true
  }: RemovePathWithRetryOptions = {}
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await fs.promises.rm(targetPath, { recursive, force })
      return
    } catch (error) {
      if (swallowMissing && isMissingPathError(error)) {
        return
      }

      if (!isRetryableFsError(error) || attempt === maxAttempts) {
        throw error
      }

      const pathKind = await resolvePathKind(targetPath)
      log.warn('[updates] fs remove retry', {
        targetPath,
        recursive,
        force,
        attempt,
        maxAttempts,
        delayMs,
        code: error.code,
        pathKind
      })

      await wait(delayMs * attempt)
    }
  }
}

export async function removePathBestEffort(
  targetPath: string,
  options?: RemovePathWithRetryOptions
): Promise<void> {
  try {
    await removePathWithRetry(targetPath, options)
  } catch (error) {
    const pathKind = await resolvePathKind(targetPath)
    log.warn('[updates] fs remove skipped after retries', {
      targetPath,
      code:
        error instanceof Error && 'code' in error ? (error as RetryableFsError).code : undefined,
      pathKind,
      error
    })
  }
}
