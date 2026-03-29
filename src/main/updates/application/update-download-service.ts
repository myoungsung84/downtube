import { app } from 'electron'
import log from 'electron-log'

import type { AppResult } from '../../../types/error.types'
import type {
  AppUpdateStage,
  CancelUpdateResult,
  DownloadUpdateResult,
  PreparedUpdateCache
} from '../../../types/update.types'
import {
  createAppError,
  failureResult,
  normalizeUnknownAppError,
  successResult
} from '../../common/app-error'
import { downloadUpdateAsset } from '../adapters/fs/update-download'
import { extractUpdateZip } from '../adapters/fs/update-extract'
import { prepareUpdateCachePaths } from '../adapters/fs/update-paths'
import { fetchLatestGithubRelease } from '../adapters/github/github-release'
import { emitAppUpdateEvent } from './update-events'

const WINDOWS_PLATFORM = 'win32'

let preparedUpdateCache: PreparedUpdateCache | null = null
let updateDownloadInFlight = false
let updateAbortController: AbortController | null = null
let updateCancelRequested = false
let updateStage: AppUpdateStage | 'idle' = 'idle'

function emitUpdateError(
  stage: AppUpdateStage,
  code: Parameters<typeof createAppError>[0],
  detail?: string,
  context?: { latestVersion?: string; assetName?: string | null }
): void {
  emitAppUpdateEvent({
    type: 'error',
    stage,
    error: createAppError(code, detail),
    ...(context?.latestVersion ? { latestVersion: context.latestVersion } : {}),
    ...(context?.assetName !== undefined ? { assetName: context.assetName } : {})
  })
}

function emitUnknownUpdateError(
  stage: AppUpdateStage,
  error: unknown,
  context?: { latestVersion?: string; assetName?: string | null }
): void {
  emitAppUpdateEvent({
    type: 'error',
    stage,
    error: normalizeUnknownAppError(
      stage === 'checking'
        ? 'updates.check_failed'
        : stage === 'downloading'
          ? 'updates.download_failed'
          : 'updates.extract_failed',
      error
    ),
    ...(context?.latestVersion ? { latestVersion: context.latestVersion } : {}),
    ...(context?.assetName !== undefined ? { assetName: context.assetName } : {})
  })
}

function resetUpdateTaskState(): void {
  updateAbortController = null
  updateCancelRequested = false
  updateStage = 'idle'
}

function emitUpdateCancelled(): void {
  preparedUpdateCache = null
  emitAppUpdateEvent({ type: 'cancelled' })
}

function throwIfUpdateCancelled(): void {
  if (!updateCancelRequested) {
    return
  }

  const error = new Error('Update cancelled') as Error & { code?: string }
  error.code = 'UPDATE_CANCELLED'
  throw error
}

function isUpdateCancellationError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const cancellableError = error as Error & { code?: string; name?: string }
  return (
    cancellableError.code === 'UPDATE_CANCELLED' ||
    cancellableError.code === 'ERR_CANCELED' ||
    cancellableError.name === 'AbortError' ||
    error.message === 'Update cancelled'
  )
}

async function runUpdateDownloadTask(): Promise<void> {
  preparedUpdateCache = null
  updateStage = 'checking'
  emitAppUpdateEvent({ type: 'checking' })

  const currentVersion = app.getVersion()
  let stage: AppUpdateStage = 'checking'
  let latestVersion: string | undefined
  let assetName: string | null | undefined

  try {
    const latestRelease = await fetchLatestGithubRelease()

    throwIfUpdateCancelled()

    latestVersion = latestRelease.latestVersion
    assetName = latestRelease.assetName

    if (!assetName || !latestRelease.assetDownloadUrl) {
      log.warn('[updates] download asset not found', {
        latestVersion,
        expectedAssetName: latestRelease.expectedAssetName
      })

      emitUpdateError(
        'checking',
        'updates.asset_not_found',
        `Expected asset not found: ${latestRelease.expectedAssetName}`,
        { latestVersion, assetName }
      )
      return
    }

    if (latestVersion === currentVersion) {
      log.info('[updates] no newer version to download', { currentVersion, latestVersion })

      emitUpdateError('checking', 'common.invalid_request', 'Already using the latest version.', {
        latestVersion,
        assetName
      })
      return
    }

    const cachePaths = await prepareUpdateCachePaths(latestVersion, assetName)

    log.info('[updates] cache paths prepared', {
      latestVersion,
      assetName,
      versionDir: cachePaths.versionDir,
      attemptDir: cachePaths.attemptDir,
      zipPath: cachePaths.zipPath,
      extractedDir: cachePaths.extractedDir
    })

    stage = 'downloading'
    updateStage = stage
    updateAbortController = new AbortController()

    log.info('[updates] download started', {
      currentVersion,
      latestVersion,
      assetName,
      zipPath: cachePaths.zipPath
    })

    await downloadUpdateAsset({
      assetUrl: latestRelease.assetDownloadUrl,
      zipPath: cachePaths.zipPath,
      signal: updateAbortController.signal,
      onStart: ({ totalBytes }) => {
        emitAppUpdateEvent({
          type: 'download-started',
          latestVersion: latestVersion!,
          assetName: assetName!,
          totalBytes
        })
      },
      onProgress: ({ downloadedBytes, totalBytes, percent }) => {
        emitAppUpdateEvent({
          type: 'download-progress',
          latestVersion: latestVersion!,
          assetName: assetName!,
          downloadedBytes,
          totalBytes,
          percent
        })
      }
    })

    updateAbortController = null
    throwIfUpdateCancelled()

    log.info('[updates] download complete', {
      latestVersion,
      assetName,
      zipPath: cachePaths.zipPath
    })

    emitAppUpdateEvent({
      type: 'download-complete',
      latestVersion,
      assetName,
      zipPath: cachePaths.zipPath
    })

    stage = 'extracting'
    updateStage = stage
    throwIfUpdateCancelled()

    emitAppUpdateEvent({
      type: 'extract-started',
      latestVersion,
      assetName,
      extractedDir: cachePaths.extractedDir
    })

    const extracted = await extractUpdateZip({
      zipPath: cachePaths.zipPath,
      extractedDir: cachePaths.extractedDir
    })

    preparedUpdateCache = {
      currentVersion,
      latestVersion,
      assetName,
      zipPath: cachePaths.zipPath,
      extractedDir: extracted.extractedDir,
      extractedAppRoot: extracted.extractedAppRoot,
      exePath: extracted.exePath
    }

    log.info('[updates] extract complete', preparedUpdateCache)

    emitAppUpdateEvent({
      type: 'extract-complete',
      cache: preparedUpdateCache
    })
  } catch (error) {
    if (isUpdateCancellationError(error)) {
      log.info('[updates] update task cancelled', { stage, latestVersion, assetName })
      emitUpdateCancelled()
      return
    }

    log.error('[updates] download task failed', { stage, latestVersion, assetName, error })
    emitUnknownUpdateError(stage, error, { latestVersion, assetName })
  } finally {
    resetUpdateTaskState()
  }
}

export function getPreparedUpdateCache(): PreparedUpdateCache | null {
  return preparedUpdateCache
}

export async function downloadUpdate(): Promise<AppResult<DownloadUpdateResult>> {
  if (process.platform !== WINDOWS_PLATFORM) {
    return failureResult('updates.unsupported_platform')
  }

  if (updateDownloadInFlight) {
    return failureResult('common.invalid_request', 'Update download is already running.')
  }

  updateDownloadInFlight = true

  void runUpdateDownloadTask().finally(() => {
    updateDownloadInFlight = false
  })

  return successResult({
    started: true
  })
}

export async function cancelUpdate(): Promise<AppResult<CancelUpdateResult>> {
  if (!updateDownloadInFlight) {
    return successResult({ cancellationRequested: false })
  }

  if (updateStage !== 'checking' && updateStage !== 'downloading') {
    return successResult({ cancellationRequested: false })
  }

  updateCancelRequested = true
  updateAbortController?.abort()

  return successResult({ cancellationRequested: true })
}
