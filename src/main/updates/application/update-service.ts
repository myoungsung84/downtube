import { app } from 'electron'
import log from 'electron-log'

import type { AppResult } from '../../../types/error.types'
import type { CheckForUpdatesResult } from '../../../types/update.types'
import { failureFromUnknown, failureResult, successResult } from '../../common/app-error'
import { fetchLatestGithubRelease } from '../adapters/github/github-release'

const WINDOWS_PLATFORM = 'win32'
const WINDOWS_ONLY_MESSAGE = 'Updates are supported on Windows only.'

export async function checkForUpdates(): Promise<AppResult<CheckForUpdatesResult>> {
  const currentVersion = app.getVersion()
  const platform = process.platform
  const isWindowsPlatform = platform === WINDOWS_PLATFORM

  log.info('[updates] checking start', { currentVersion, platform })

  try {
    const latestRelease = await fetchLatestGithubRelease()

    log.info('[updates] latest fetched', {
      currentVersion,
      latestVersion: latestRelease.latestVersion,
      tagName: latestRelease.tagName,
      releaseUrl: latestRelease.htmlUrl
    })

    if (isWindowsPlatform && (!latestRelease.assetName || !latestRelease.assetDownloadUrl)) {
      log.warn('[updates] asset not found', {
        expectedAssetName: latestRelease.expectedAssetName,
        tagName: latestRelease.tagName
      })

      return failureResult(
        'updates.asset_not_found',
        `Expected asset not found: ${latestRelease.expectedAssetName}`
      )
    }

    if (isWindowsPlatform && latestRelease.assetName && latestRelease.assetDownloadUrl) {
      log.info('[updates] asset selected', {
        assetName: latestRelease.assetName,
        assetDownloadUrl: latestRelease.assetDownloadUrl
      })
    }

    return successResult({
      currentVersion,
      latestVersion: latestRelease.latestVersion,
      updateAvailable: latestRelease.latestVersion !== currentVersion,
      platformSupported: isWindowsPlatform,
      releaseUrl: latestRelease.htmlUrl,
      assetName: isWindowsPlatform ? latestRelease.assetName : null,
      publishedAt: latestRelease.publishedAt,
      message: isWindowsPlatform ? undefined : WINDOWS_ONLY_MESSAGE
    })
  } catch (error) {
    log.error('[updates] check failed', error)
    return failureFromUnknown('updates.check_failed', error)
  }
}
