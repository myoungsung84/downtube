import type { AppError } from './error.types'

export type CheckForUpdatesResult = {
  currentVersion: string
  latestVersion: string
  updateAvailable: boolean
  platformSupported: boolean
  releaseUrl: string
  assetName: string | null
  publishedAt: string | null
  message?: string
}

export type DownloadUpdateResult = {
  started: boolean
}

export type ApplyUpdateResult = {
  started: boolean
}

export type PreparedUpdateCache = {
  currentVersion: string
  latestVersion: string
  assetName: string
  zipPath: string
  extractedDir: string
  extractedAppRoot: string
  exePath: string
}

export type AppUpdateStage = 'checking' | 'downloading' | 'extracting' | 'verifying' | 'applying'

export type AppUpdateEvent =
  | {
      type: 'checking'
    }
  | {
      type: 'download-started'
      latestVersion: string
      assetName: string
      totalBytes: number | null
    }
  | {
      type: 'download-progress'
      latestVersion: string
      assetName: string
      downloadedBytes: number
      totalBytes: number | null
      percent: number | null
    }
  | {
      type: 'download-complete'
      latestVersion: string
      assetName: string
      zipPath: string
    }
  | {
      type: 'extract-started'
      latestVersion: string
      assetName: string
      extractedDir: string
    }
  | {
      type: 'extract-complete'
      cache: PreparedUpdateCache
    }
  | {
      type: 'apply-started'
      latestVersion: string
    }
  | {
      type: 'apply-launching'
      latestVersion: string
    }
  | {
      type: 'error'
      stage: AppUpdateStage
      error: AppError
      latestVersion?: string
      assetName?: string | null
    }
