import { useI18n } from '@renderer/shared/hooks/use-i18n'
import { useToast } from '@renderer/shared/hooks/use-toast'
import { resolveAppErrorMessage } from '@renderer/shared/lib/app-error'
import type { AppRuntimeInfo } from '@src/types/app.types'
import type { CheckForUpdatesResult, PreparedUpdateCache } from '@src/types/update.types'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  type UpdateCheckStatus,
  updateContext,
  type UpdateContextValue,
  type UpdateDownloadProgress,
  type UpdateProgressStatus
} from './update-context'

export default function UpdateProvider({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const { t } = useI18n('settings')
  const { showToast } = useToast()
  const [runtimeInfo, setRuntimeInfo] = useState<AppRuntimeInfo | null>(null)
  const [updateCheckStatus, setUpdateCheckStatus] = useState<UpdateCheckStatus>('idle')
  const [updateResult, setUpdateResult] = useState<CheckForUpdatesResult | null>(null)
  const [updateProgressStatus, setUpdateProgressStatus] = useState<UpdateProgressStatus>('idle')
  const [updateDownloadProgress, setUpdateDownloadProgress] =
    useState<UpdateDownloadProgress | null>(null)
  const [preparedUpdateCache, setPreparedUpdateCache] = useState<PreparedUpdateCache | null>(null)
  const pendingApplyAfterExtractRef = useRef(false)

  const isPackagedApp = runtimeInfo?.isPackaged === true
  const isWindowsPlatform = runtimeInfo?.platform === 'win32'
  const isMacPlatform = runtimeInfo?.platform === 'darwin'
  const isUpdateInProgress = updateProgressStatus !== 'idle'
  const updateProgressPercent =
    updateDownloadProgress?.percent != null ? Math.round(updateDownloadProgress.percent) : null

  useEffect(() => {
    let active = true

    void window.api
      .getRuntimeInfo()
      .then((info) => {
        if (!active) {
          return
        }

        setRuntimeInfo(info)
        setUpdateCheckStatus(
          info.platform === 'win32' || info.platform === 'darwin' ? 'idle' : 'unsupported'
        )
      })
      .catch((error) => {
        if (!active) {
          return
        }

        setUpdateCheckStatus('error')
        showToast(
          resolveAppErrorMessage(error, 'settings:updates.toast.runtime_load_failed'),
          'error'
        )
      })

    return () => {
      active = false
    }
  }, [showToast])

  useEffect(() => {
    let active = true

    void window.api
      .getPreparedUpdate()
      .then((preparedUpdate) => {
        if (!active || !preparedUpdate) {
          return
        }

        setPreparedUpdateCache(preparedUpdate)
      })
      .catch(() => {
        if (!active) {
          return
        }
      })

    return () => {
      active = false
    }
  }, [])

  const applyPreparedUpdate = useCallback(async (): Promise<boolean> => {
    setUpdateProgressStatus('applying')

    try {
      const result = await window.api.applyUpdate()

      if (!result.success) {
        setUpdateProgressStatus('idle')
        showToast(
          resolveAppErrorMessage(result.error, 'settings:updates.toast.apply_failed'),
          'error'
        )
        return false
      }

      return true
    } catch (error) {
      setUpdateProgressStatus('idle')
      showToast(resolveAppErrorMessage(error, 'settings:updates.toast.apply_failed'), 'error')
      return false
    }
  }, [showToast])

  const checkForUpdates = useCallback(
    async ({
      silent = false
    }: { silent?: boolean } = {}): Promise<CheckForUpdatesResult | null> => {
      if (!runtimeInfo) {
        return null
      }

      if (!runtimeInfo.isPackaged) {
        setUpdateCheckStatus('idle')
        return null
      }

      if (runtimeInfo.platform !== 'win32' && runtimeInfo.platform !== 'darwin') {
        setUpdateCheckStatus('unsupported')
        return null
      }

      setUpdateCheckStatus('checking')

      try {
        const result = await window.api.checkForUpdates()

        if (!result.success) {
          setUpdateCheckStatus('error')
          if (!silent) {
            showToast(
              resolveAppErrorMessage(result.error, 'settings:updates.toast.check_failed'),
              'error'
            )
          }
          return null
        }

        setUpdateResult(result)

        if (!result.platformSupported && runtimeInfo.platform !== 'darwin') {
          setUpdateCheckStatus('unsupported')
          return result
        }

        setUpdateCheckStatus(result.updateAvailable ? 'available' : 'up-to-date')
        return result
      } catch (error) {
        setUpdateCheckStatus('error')
        if (!silent) {
          showToast(resolveAppErrorMessage(error, 'settings:updates.toast.check_failed'), 'error')
        }
        return null
      }
    },
    [runtimeInfo, showToast]
  )

  useEffect(() => {
    if (
      !runtimeInfo ||
      !runtimeInfo.isPackaged ||
      (runtimeInfo.platform !== 'win32' && runtimeInfo.platform !== 'darwin')
    ) {
      return
    }

    void checkForUpdates({ silent: true })
  }, [checkForUpdates, runtimeInfo])

  useEffect(() => {
    const unsubscribe = window.api.onAppUpdateEvent((event) => {
      switch (event.type) {
        case 'checking':
          setUpdateProgressStatus('checking')
          setUpdateDownloadProgress(null)
          setPreparedUpdateCache(null)
          return
        case 'download-started':
          setUpdateProgressStatus('downloading')
          setUpdateDownloadProgress({
            downloadedBytes: 0,
            totalBytes: event.totalBytes,
            percent: event.totalBytes ? 0 : null
          })
          setPreparedUpdateCache(null)
          return
        case 'download-progress':
          setUpdateProgressStatus('downloading')
          setUpdateDownloadProgress({
            downloadedBytes: event.downloadedBytes,
            totalBytes: event.totalBytes,
            percent: event.percent
          })
          return
        case 'download-complete':
          setUpdateDownloadProgress((prev) => {
            if (!prev) {
              return prev
            }

            return {
              downloadedBytes: prev.totalBytes ?? prev.downloadedBytes,
              totalBytes: prev.totalBytes,
              percent: prev.totalBytes ? 100 : prev.percent
            }
          })
          return
        case 'extract-started':
          setUpdateProgressStatus('extracting')
          return
        case 'extract-complete':
          setPreparedUpdateCache(event.cache)
          setUpdateDownloadProgress((prev) => {
            if (!prev) {
              return prev
            }

            return {
              downloadedBytes: prev.totalBytes ?? prev.downloadedBytes,
              totalBytes: prev.totalBytes,
              percent: prev.totalBytes ? 100 : prev.percent
            }
          })

          if (pendingApplyAfterExtractRef.current) {
            pendingApplyAfterExtractRef.current = false
            void applyPreparedUpdate()
          }
          return
        case 'apply-started':
          setUpdateProgressStatus('applying')
          return
        case 'apply-launching':
          setUpdateProgressStatus('applying')
          return
        case 'cancelled':
          pendingApplyAfterExtractRef.current = false
          setUpdateProgressStatus('idle')
          setUpdateDownloadProgress(null)
          setPreparedUpdateCache(null)
          return
        case 'error':
          pendingApplyAfterExtractRef.current = false
          setUpdateProgressStatus('idle')
          setUpdateDownloadProgress(null)

          if (event.stage !== 'applying') {
            setPreparedUpdateCache(null)
          }

          if (event.stage === 'applying') {
            showToast(
              resolveAppErrorMessage(event.error, 'settings:updates.toast.apply_failed'),
              'error'
            )
            return
          }

          showToast(
            resolveAppErrorMessage(event.error, 'settings:updates.toast.download_failed'),
            'error'
          )
          return
      }
    })

    return unsubscribe
  }, [applyPreparedUpdate, showToast])

  const startUpdate = useCallback(async (): Promise<void> => {
    if (
      !runtimeInfo ||
      !runtimeInfo.isPackaged ||
      runtimeInfo.platform !== 'win32' ||
      isUpdateInProgress
    ) {
      return
    }

    setUpdateProgressStatus('checking')
    setUpdateDownloadProgress(null)

    const latestResult = await checkForUpdates()

    if (!latestResult || !latestResult.platformSupported || !latestResult.updateAvailable) {
      setUpdateProgressStatus('idle')
      setUpdateDownloadProgress(null)
      return
    }

    const canUsePreparedUpdate =
      preparedUpdateCache != null &&
      preparedUpdateCache.latestVersion === latestResult.latestVersion

    if (canUsePreparedUpdate) {
      await applyPreparedUpdate()
      return
    }

    try {
      const result = await window.api.downloadUpdate()

      if (!result.success) {
        setUpdateProgressStatus('idle')
        setUpdateDownloadProgress(null)
        showToast(
          resolveAppErrorMessage(result.error, 'settings:updates.toast.download_failed'),
          'error'
        )
        return
      }

      pendingApplyAfterExtractRef.current = true
    } catch (error) {
      pendingApplyAfterExtractRef.current = false
      setUpdateProgressStatus('idle')
      setUpdateDownloadProgress(null)
      showToast(resolveAppErrorMessage(error, 'settings:updates.toast.download_failed'), 'error')
    }
  }, [
    applyPreparedUpdate,
    checkForUpdates,
    isUpdateInProgress,
    preparedUpdateCache,
    runtimeInfo,
    showToast
  ])

  const cancelUpdate = useCallback(async (): Promise<boolean> => {
    pendingApplyAfterExtractRef.current = false

    try {
      const result = await window.api.cancelUpdate()

      if (!result.success) {
        return false
      }

      if (result.cancellationRequested) {
        setUpdateProgressStatus('idle')
        setUpdateDownloadProgress(null)
        setPreparedUpdateCache(null)
      }

      return result.cancellationRequested
    } catch {
      return false
    }
  }, [])

  const openReleasePage = useCallback(async (): Promise<void> => {
    if (!isPackagedApp) {
      return
    }

    const releaseUrl = updateResult?.releaseUrl

    if (!releaseUrl) {
      return
    }

    const result = await window.api.openExternalUrl(releaseUrl)

    if (!result.success) {
      showToast(t('updates.toast.open_release_failed'), 'error')
    }
  }, [isPackagedApp, showToast, t, updateResult])

  const value = useMemo<UpdateContextValue>(
    () => ({
      runtimeInfo,
      updateCheckStatus,
      updateResult,
      updateProgressStatus,
      updateDownloadProgress,
      preparedUpdateCache,
      isWindowsPlatform,
      isMacPlatform,
      isUpdateInProgress,
      updateProgressPercent,
      checkForUpdates,
      startUpdate,
      cancelUpdate,
      openReleasePage
    }),
    [
      runtimeInfo,
      updateCheckStatus,
      updateResult,
      updateProgressStatus,
      updateDownloadProgress,
      preparedUpdateCache,
      isWindowsPlatform,
      isMacPlatform,
      isUpdateInProgress,
      updateProgressPercent,
      checkForUpdates,
      startUpdate,
      cancelUpdate,
      openReleasePage
    ]
  )

  return <updateContext.Provider value={value}>{children}</updateContext.Provider>
}
