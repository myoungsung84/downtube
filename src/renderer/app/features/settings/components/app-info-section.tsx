import { alpha, Button, Divider, LinearProgress, Paper, Stack, Typography } from '@mui/material'
import { useDialog } from '@renderer/shared/hooks/use-dialog'
import { useI18n } from '@renderer/shared/hooks/use-i18n'
import { useToast } from '@renderer/shared/hooks/use-toast'
import { resolveAppErrorMessage } from '@renderer/shared/lib/app-error'
import type { AppRuntimeInfo } from '@src/types/app.types'
import type { CheckForUpdatesResult, PreparedUpdateCache } from '@src/types/update.types'
import React, { useCallback, useEffect, useState } from 'react'

type UpdateCheckStatus = 'idle' | 'checking' | 'available' | 'up-to-date' | 'unsupported' | 'error'
type UpdateProgressStatus = 'idle' | 'checking' | 'downloading' | 'extracting' | 'applying'

export function AppInfoSection(): React.JSX.Element {
  const { t } = useI18n('settings')
  const { showToast } = useToast()
  const { confirm } = useDialog()
  const [runtimeInfo, setRuntimeInfo] = useState<AppRuntimeInfo | null>(null)
  const [updateCheckStatus, setUpdateCheckStatus] = useState<UpdateCheckStatus>('idle')
  const [updateResult, setUpdateResult] = useState<CheckForUpdatesResult | null>(null)
  const [updateProgressStatus, setUpdateProgressStatus] = useState<UpdateProgressStatus>('idle')
  const [updateDownloadProgress, setUpdateDownloadProgress] = useState<{
    downloadedBytes: number
    totalBytes: number | null
    percent: number | null
  } | null>(null)
  const [preparedUpdateCache, setPreparedUpdateCache] = useState<PreparedUpdateCache | null>(null)

  useEffect(() => {
    let active = true

    void window.api
      .getRuntimeInfo()
      .then((info) => {
        if (!active) return
        setRuntimeInfo(info)
        setUpdateCheckStatus(info.platform === 'win32' ? 'idle' : 'unsupported')
      })
      .catch((error) => {
        if (!active) return
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

  const checkForUpdates = useCallback(
    async ({
      silent = false
    }: { silent?: boolean } = {}): Promise<CheckForUpdatesResult | null> => {
      if (!runtimeInfo || runtimeInfo.platform !== 'win32') {
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

        if (!result.platformSupported) {
          setUpdateCheckStatus('unsupported')
          return null
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
    if (!runtimeInfo || runtimeInfo.platform !== 'win32') {
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
          return
        case 'apply-started':
          setUpdateProgressStatus('applying')
          return
        case 'apply-launching':
          setUpdateProgressStatus('applying')
          return
        case 'error':
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
  }, [showToast])

  const isWindowsPlatform = runtimeInfo?.platform === 'win32'
  const isUpdateInProgress = updateProgressStatus !== 'idle'
  const showUpdateButton =
    isWindowsPlatform &&
    updateCheckStatus === 'available' &&
    updateResult?.platformSupported === true
  const updateProgressPercent =
    updateDownloadProgress?.percent != null ? Math.round(updateDownloadProgress.percent) : null

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

  const handleStartUpdate = useCallback(async (): Promise<void> => {
    if (!isWindowsPlatform || isUpdateInProgress) {
      return
    }

    const confirmed = await confirm({
      title: t('updates.dialog.title'),
      message: t('updates.dialog.message'),
      confirmText: t('updates.actions.update')
    })

    if (!confirmed) {
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
    } catch (error) {
      setUpdateProgressStatus('idle')
      setUpdateDownloadProgress(null)
      showToast(resolveAppErrorMessage(error, 'settings:updates.toast.download_failed'), 'error')
      return
    }

    await applyPreparedUpdate()
  }, [
    applyPreparedUpdate,
    checkForUpdates,
    confirm,
    isUpdateInProgress,
    isWindowsPlatform,
    preparedUpdateCache,
    showToast,
    t
  ])

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        background: (theme) =>
          theme.palette.mode === 'light'
            ? `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(
                theme.palette.info.main,
                0.018
              )} 100%)`
            : theme.palette.background.paper
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ px: 3, py: 2, bgcolor: 'action.hover' }}
      >
        <Typography variant="overline" fontWeight={700} color="text.secondary" letterSpacing={1.5}>
          {t('updates.section_title')}
        </Typography>
      </Stack>

      <Divider />

      <Stack>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ px: 3, py: 2.5 }}
        >
          <Stack spacing={0.4}>
            <Typography variant="body2" fontWeight={700}>
              {t('updates.current_version.title')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('updates.current_version.description')}
            </Typography>
          </Stack>

          <Typography variant="body2" fontWeight={700}>
            {runtimeInfo?.version ?? '-'}
          </Typography>
        </Stack>

        {showUpdateButton && (
          <>
            <Divider />
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={2}
              sx={{ px: 3, py: 2.5 }}
            >
              <Stack spacing={0.4}>
                <Typography variant="body2" fontWeight={700}>
                  {t('updates.actions.title')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('updates.actions.description')}
                </Typography>
              </Stack>

              <Button
                variant="contained"
                disabled={isUpdateInProgress}
                onClick={() => {
                  void handleStartUpdate()
                }}
              >
                {isUpdateInProgress ? t('updates.actions.updating') : t('updates.actions.update')}
              </Button>
            </Stack>
          </>
        )}

        {isUpdateInProgress && (
          <>
            <Divider />
            <Stack spacing={1.25} sx={{ px: 3, py: 2.5 }}>
              <Typography variant="body2" fontWeight={700}>
                {t('updates.progress.message')}
              </Typography>
              <LinearProgress
                variant={updateProgressPercent != null ? 'determinate' : 'indeterminate'}
                value={updateProgressPercent ?? 0}
                sx={{
                  height: 6,
                  borderRadius: 999,
                  bgcolor: 'action.hover'
                }}
              />
              {updateProgressPercent != null && (
                <Typography variant="caption" color="text.secondary">
                  {t('updates.progress.percent', { percent: updateProgressPercent })}
                </Typography>
              )}
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  )
}
