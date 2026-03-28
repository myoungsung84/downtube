import { app } from 'electron'
import log from 'electron-log'

import type { AppResult } from '../../../types/error.types'
import type { CheckForUpdatesResult } from '../../../types/update.types'
import { failureFromUnknown, failureResult, successResult } from '../../common/app-error'
import { fetchLatestGithubRelease } from '../adapters/github/github-release'
import { UPDATE_REPOSITORY } from '../shared/update.types'

const WINDOWS_PLATFORM = 'win32'
const REPOSITORY_RELEASES_URL = `https://github.com/${UPDATE_REPOSITORY.owner}/${UPDATE_REPOSITORY.name}/releases`
const WINDOWS_ONLY_MESSAGE = 'Updates are supported on Windows only.'

export async function checkForUpdates(): Promise<AppResult<CheckForUpdatesResult>> {
  const currentVersion = app.getVersion()
  const platform = process.platform

  if (platform !== WINDOWS_PLATFORM) {
    log.info('[updates] unsupported platform', { currentVersion, platform })

    return successResult({
      currentVersion,
      latestVersion: currentVersion,
      updateAvailable: false,
      platformSupported: false,
      releaseUrl: REPOSITORY_RELEASES_URL,
      assetName: null,
      publishedAt: null,
      message: WINDOWS_ONLY_MESSAGE
    })
  }

  log.info('[updates] checking start', { currentVersion, platform })

  try {
    const latestRelease = await fetchLatestGithubRelease()

    log.info('[updates] latest fetched', {
      currentVersion,
      latestVersion: latestRelease.latestVersion,
      tagName: latestRelease.tagName,
      releaseUrl: latestRelease.htmlUrl
    })

    if (!latestRelease.assetName || !latestRelease.assetDownloadUrl) {
      log.warn('[updates] asset not found', {
        expectedAssetName: latestRelease.expectedAssetName,
        tagName: latestRelease.tagName
      })

      return failureResult(
        'updates.asset_not_found',
        `Expected asset not found: ${latestRelease.expectedAssetName}`
      )
    }

    log.info('[updates] asset selected', {
      assetName: latestRelease.assetName,
      assetDownloadUrl: latestRelease.assetDownloadUrl
    })

    return successResult({
      currentVersion,
      latestVersion: latestRelease.latestVersion,
      updateAvailable: latestRelease.latestVersion !== currentVersion,
      platformSupported: true,
      releaseUrl: latestRelease.htmlUrl,
      assetName: latestRelease.assetName,
      publishedAt: latestRelease.publishedAt
    })
  } catch (error) {
    log.error('[updates] check failed', error)
    return failureFromUnknown('updates.check_failed', error)
  }
}
