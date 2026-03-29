import type { AppRuntimeInfo } from '@src/types/app.types'
import type { CheckForUpdatesResult, PreparedUpdateCache } from '@src/types/update.types'
import { createContext } from 'react'

export type UpdateCheckStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'up-to-date'
  | 'unsupported'
  | 'error'

export type UpdateProgressStatus = 'idle' | 'checking' | 'downloading' | 'extracting' | 'applying'

export type UpdateDownloadProgress = {
  downloadedBytes: number
  totalBytes: number | null
  percent: number | null
}

export type UpdateContextValue = {
  runtimeInfo: AppRuntimeInfo | null
  updateCheckStatus: UpdateCheckStatus
  updateResult: CheckForUpdatesResult | null
  updateProgressStatus: UpdateProgressStatus
  updateDownloadProgress: UpdateDownloadProgress | null
  preparedUpdateCache: PreparedUpdateCache | null
  isWindowsPlatform: boolean
  isMacPlatform: boolean
  isUpdateInProgress: boolean
  updateProgressPercent: number | null
  checkForUpdates: (options?: { silent?: boolean }) => Promise<CheckForUpdatesResult | null>
  startUpdate: () => Promise<void>
  cancelUpdate: () => Promise<boolean>
  openReleasePage: () => Promise<void>
}

export const updateContext = createContext<UpdateContextValue | null>(null)
