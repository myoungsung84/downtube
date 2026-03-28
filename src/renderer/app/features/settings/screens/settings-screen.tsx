import AudiotrackIcon from '@mui/icons-material/Audiotrack'
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary'
import {
  alpha,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import type { Theme } from '@mui/material/styles'
import { useSettingsStore } from '@renderer/features/settings/store/use-settings-store'
import { useI18n } from '@renderer/shared/hooks/use-i18n'
import { useToast } from '@renderer/shared/hooks/use-toast'
import { resolveAppErrorMessage } from '@renderer/shared/lib/app-error'
import type { AppRuntimeInfo } from '@src/types/app.types'
import type { AppLanguagePreference, AppThemePreset } from '@src/types/settings.types'
import type { CheckForUpdatesResult, PreparedUpdateCache } from '@src/types/update.types'
import { isAppThemePreset } from '@src/types/settings.types'
import React, { useEffect, useState } from 'react'

// ─── shared sx ────────────────────────────────────────────────────────────────

const TOGGLE_GROUP_SX = {
  bgcolor: 'action.hover',
  borderRadius: '10px',
  p: 0.5,
  border: '1px solid',
  borderColor: (theme: Theme) =>
    theme.palette.mode === 'light'
      ? alpha(theme.palette.primary.main, 0.15)
      : alpha(theme.palette.common.white, 0.06),
  gap: 0.5,
  '& .MuiToggleButtonGroup-grouped': {
    border: 'none !important',
    borderRadius: '8px !important',
    m: 0
  },
  '& .MuiToggleButton-root': {
    px: 2.25,
    py: 0.875,
    fontWeight: 600,
    fontSize: '0.8rem',
    color: 'text.secondary',
    transition: 'all 0.18s ease',
    '&.Mui-selected': {
      bgcolor: (theme: Theme) =>
        theme.palette.mode === 'light'
          ? alpha(theme.palette.primary.main, 0.1)
          : theme.palette.background.paper,
      color: 'text.primary',
      boxShadow: (theme: Theme) =>
        theme.palette.mode === 'light'
          ? `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.24)}, 0 1px 3px ${alpha(theme.palette.common.black, 0.08)}`
          : `0 1px 4px ${alpha(theme.palette.common.black, 0.15)}`,
      '&:hover': {
        bgcolor: (theme: Theme) =>
          theme.palette.mode === 'light'
            ? alpha(theme.palette.primary.main, 0.14)
            : theme.palette.background.paper
      }
    },
    '&:hover:not(.Mui-selected)': {
      bgcolor: (theme: Theme) =>
        theme.palette.mode === 'light'
          ? alpha(theme.palette.primary.main, 0.06)
          : theme.palette.action.selected
    }
  }
}

// ─── keys ─────────────────────────────────────────────────────────────────────

const APP_LANGUAGE_KEY = 'app.language' as const
const APP_THEME_MODE_KEY = 'app.themeMode' as const
const APP_THEME_PRESET_KEY = 'app.themePreset' as const
const DOWNLOADS_DEFAULT_TYPE_KEY = 'downloads.defaultType' as const
const DOWNLOADS_PLAYLIST_LIMIT_KEY = 'downloads.playlistLimit' as const

type UpdateCheckStatus = 'idle' | 'checking' | 'available' | 'up-to-date' | 'unsupported' | 'error'
type UpdateDownloadStatus =
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'extracting'
  | 'completed'
  | 'applying'
  | 'unsupported'
  | 'error'

function resolvePlatformLabel(platform: NodeJS.Platform, t: ReturnType<typeof useI18n>['t']): string {
  switch (platform) {
    case 'win32':
      return t('updates.platforms.win32')
    case 'darwin':
      return t('updates.platforms.darwin')
    case 'linux':
      return t('updates.platforms.linux')
    default:
      return t('updates.platforms.unknown', { platform })
  }
}

function resolveUpdateStatusChipColor(
  status: UpdateCheckStatus
): 'default' | 'error' | 'info' | 'success' | 'warning' {
  switch (status) {
    case 'checking':
      return 'info'
    case 'available':
      return 'warning'
    case 'up-to-date':
      return 'success'
    case 'error':
      return 'error'
    default:
      return 'default'
  }
}

function resolveDownloadStatusChipColor(
  status: UpdateDownloadStatus
): 'default' | 'error' | 'info' | 'success' | 'warning' {
  switch (status) {
    case 'checking':
    case 'downloading':
    case 'extracting':
      return 'info'
    case 'completed':
      return 'success'
    case 'applying':
      return 'warning'
    case 'error':
      return 'error'
    default:
      return 'default'
  }
}

function formatPublishedAt(value: string): string {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString()
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${bytes} B`
}

export default function SettingsScreen(): React.JSX.Element {
  const { t, changeLanguage } = useI18n('settings')
  const { showToast } = useToast()
  const hydrateSettings = useSettingsStore((state) => state.hydrateSettings)
  const setSettingValue = useSettingsStore((state) => state.setValue)
  const storedLanguage = useSettingsStore((state) => state.values[APP_LANGUAGE_KEY])
  const storedThemeMode = useSettingsStore((state) => state.values[APP_THEME_MODE_KEY])
  const storedThemePreset = useSettingsStore((state) => state.values[APP_THEME_PRESET_KEY])
  const storedDefaultType = useSettingsStore((state) => state.values[DOWNLOADS_DEFAULT_TYPE_KEY])
  const storedPlaylistLimit = useSettingsStore(
    (state) => state.values[DOWNLOADS_PLAYLIST_LIMIT_KEY]
  )
  const [runtimeInfo, setRuntimeInfo] = useState<AppRuntimeInfo | null>(null)
  const [updateCheckStatus, setUpdateCheckStatus] = useState<UpdateCheckStatus>('idle')
  const [updateResult, setUpdateResult] = useState<CheckForUpdatesResult | null>(null)
  const [updateDownloadStatus, setUpdateDownloadStatus] = useState<UpdateDownloadStatus>('idle')
  const [updateDownloadProgress, setUpdateDownloadProgress] = useState<{
    downloadedBytes: number
    totalBytes: number | null
    percent: number | null
  } | null>(null)
  const [preparedUpdateCache, setPreparedUpdateCache] = useState<PreparedUpdateCache | null>(null)
  const [downloadCompleted, setDownloadCompleted] = useState(false)
  const [extractCompleted, setExtractCompleted] = useState(false)
  const [applyInFlight, setApplyInFlight] = useState(false)

  const language: AppLanguagePreference =
    storedLanguage === 'ko' || storedLanguage === 'en' ? storedLanguage : 'system'
  const themeMode: 'light' | 'dark' | 'system' =
    storedThemeMode === 'light' || storedThemeMode === 'dark' ? storedThemeMode : 'system'

  const rawPreset: AppThemePreset = isAppThemePreset(storedThemePreset)
    ? storedThemePreset
    : 'default'

  // mode와 맞지 않는 preset은 default로 표시
  const themePreset: AppThemePreset = (() => {
    if (themeMode === 'system') return 'default'
    if (themeMode === 'light') return rawPreset === 'slate' ? 'slate' : 'default'
    if (rawPreset === 'ink' || rawPreset === 'jade' || rawPreset === 'aurora') return rawPreset
    return 'default'
  })()

  const defaultType: 'video' | 'audio' = storedDefaultType === 'audio' ? 'audio' : 'video'
  const playlistLimit =
    typeof storedPlaylistLimit === 'number' &&
    Number.isFinite(storedPlaylistLimit) &&
    Number.isInteger(storedPlaylistLimit) &&
    storedPlaylistLimit >= 1
      ? storedPlaylistLimit
      : 10

  useEffect(() => {
    void hydrateSettings([
      APP_LANGUAGE_KEY,
      APP_THEME_MODE_KEY,
      APP_THEME_PRESET_KEY,
      DOWNLOADS_DEFAULT_TYPE_KEY,
      DOWNLOADS_PLAYLIST_LIMIT_KEY
    ])
  }, [hydrateSettings])

  useEffect(() => {
    let active = true

    void window.api
      .getRuntimeInfo()
      .then((info) => {
        if (!active) return
        setRuntimeInfo(info)
        setUpdateCheckStatus(info.platform === 'win32' ? 'idle' : 'unsupported')
        setUpdateDownloadStatus(info.platform === 'win32' ? 'idle' : 'unsupported')
      })
      .catch((error) => {
        if (!active) return
        setUpdateCheckStatus('error')
        setUpdateDownloadStatus('error')
        showToast(resolveAppErrorMessage(error, 'settings:updates.toast.runtime_load_failed'), 'error')
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
        setDownloadCompleted(true)
        setExtractCompleted(true)
        setUpdateDownloadStatus('completed')
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

  useEffect(() => {
    const unsubscribe = window.api.onAppUpdateEvent((event) => {
      switch (event.type) {
        case 'checking':
          setUpdateDownloadStatus('checking')
          setUpdateDownloadProgress(null)
          setPreparedUpdateCache(null)
          setDownloadCompleted(false)
          setExtractCompleted(false)
          return
        case 'download-started':
          setUpdateDownloadStatus('downloading')
          setUpdateDownloadProgress({
            downloadedBytes: 0,
            totalBytes: event.totalBytes,
            percent: event.totalBytes ? 0 : null
          })
          setPreparedUpdateCache(null)
          setDownloadCompleted(false)
          setExtractCompleted(false)
          return
        case 'download-progress':
          setUpdateDownloadStatus('downloading')
          setUpdateDownloadProgress({
            downloadedBytes: event.downloadedBytes,
            totalBytes: event.totalBytes,
            percent: event.percent
          })
          return
        case 'download-complete':
          setDownloadCompleted(true)
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
          setUpdateDownloadStatus('extracting')
          return
        case 'extract-complete':
          setUpdateDownloadStatus('completed')
          setApplyInFlight(false)
          setPreparedUpdateCache(event.cache)
          setDownloadCompleted(true)
          setExtractCompleted(true)
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
          showToast(t('updates.toast.download_completed'), 'success')
          return
        case 'apply-started':
          setApplyInFlight(true)
          setUpdateDownloadStatus('applying')
          return
        case 'apply-launching':
          setApplyInFlight(true)
          setUpdateDownloadStatus('applying')
          return
        case 'error':
          setApplyInFlight(false)
          setUpdateDownloadStatus(event.stage === 'applying' && preparedUpdateCache ? 'completed' : 'error')

          if (event.stage !== 'applying') {
            setPreparedUpdateCache(null)
            setExtractCompleted(false)
          }

          if (event.stage === 'checking' || event.stage === 'downloading') {
            setDownloadCompleted(false)
          }

          if (event.stage === 'applying') {
            showToast(resolveAppErrorMessage(event.error, 'settings:updates.toast.apply_failed'), 'error')
            return
          }

          showToast(resolveAppErrorMessage(event.error, 'settings:updates.toast.download_failed'), 'error')
          return
      }
    })

    return unsubscribe
  }, [preparedUpdateCache, showToast, t])

  const isWindowsPlatform = runtimeInfo?.platform === 'win32'
  const latestVersionValue = (() => {
    if (updateResult?.platformSupported) {
      return updateResult.latestVersion
    }

    if (updateCheckStatus === 'unsupported') {
      return t('updates.latest_version.unsupported')
    }

    return t('updates.latest_version.not_checked')
  })()

  const updateCheckStatusText = (() => {
    switch (updateCheckStatus) {
      case 'checking':
        return t('updates.status.checking')
      case 'available':
        return t('updates.status.available', { version: updateResult?.latestVersion ?? '-' })
      case 'up-to-date':
        return t('updates.status.up_to_date')
      case 'unsupported':
        return t('updates.status.unsupported')
      case 'error':
        return t('updates.status.error')
      default:
        return t('updates.status.idle')
    }
  })()

  const downloadStatusText = (() => {
    switch (updateDownloadStatus) {
      case 'checking':
        return t('updates.download_status.checking')
      case 'downloading':
        return t('updates.download_status.downloading')
      case 'extracting':
        return t('updates.download_status.extracting')
      case 'completed':
        return t('updates.download_status.completed')
      case 'applying':
        return t('updates.download_status.applying')
      case 'unsupported':
        return t('updates.download_status.unsupported')
      case 'error':
        return t('updates.download_status.error')
      default:
        return t('updates.download_status.idle')
    }
  })()

  const publishedAtLabel =
    updateResult?.platformSupported && updateResult.publishedAt
      ? formatPublishedAt(updateResult.publishedAt)
      : null

  const progressText = (() => {
    if (updateDownloadStatus === 'unsupported') {
      return t('updates.progress.unsupported')
    }

    if (updateDownloadStatus === 'checking') {
      return t('updates.progress.checking')
    }

    if (updateDownloadStatus === 'extracting') {
      return t('updates.progress.extracting')
    }

    if (updateDownloadStatus === 'applying') {
      return t('updates.progress.applying')
    }

    if (updateDownloadProgress?.totalBytes) {
      return t('updates.progress.bytes_with_total', {
        downloaded: formatBytes(updateDownloadProgress.downloadedBytes),
        total: formatBytes(updateDownloadProgress.totalBytes),
        percent: updateDownloadProgress.percent ?? 0
      })
    }

    if (updateDownloadProgress?.downloadedBytes) {
      return t('updates.progress.bytes_without_total', {
        downloaded: formatBytes(updateDownloadProgress.downloadedBytes)
      })
    }

    if (updateDownloadStatus === 'completed') {
      return t('updates.progress.completed')
    }

    if (updateDownloadStatus === 'error') {
      return t('updates.progress.error')
    }

    return t('updates.progress.idle')
  })()

  const canDownloadUpdate =
    Boolean(runtimeInfo) &&
    isWindowsPlatform &&
    updateResult?.platformSupported === true &&
    updateResult.updateAvailable &&
    updateCheckStatus !== 'checking' &&
    !applyInFlight &&
    updateDownloadStatus !== 'checking' &&
    updateDownloadStatus !== 'downloading' &&
    updateDownloadStatus !== 'extracting' &&
    updateDownloadStatus !== 'applying'

  const canApplyUpdate =
    Boolean(runtimeInfo) &&
    isWindowsPlatform &&
    updateResult?.platformSupported === true &&
    updateResult.updateAvailable &&
    Boolean(preparedUpdateCache) &&
    !applyInFlight &&
    updateDownloadStatus !== 'applying'

  const handleCheckForUpdates = async (): Promise<void> => {
    if (!runtimeInfo || runtimeInfo.platform !== 'win32' || updateCheckStatus === 'checking') {
      return
    }

    setUpdateCheckStatus('checking')

    try {
      const result = await window.api.checkForUpdates()

      if (!result.success) {
        setUpdateCheckStatus('error')
        showToast(resolveAppErrorMessage(result.error, 'settings:updates.toast.check_failed'), 'error')
        return
      }

      setUpdateResult(result)

      if (!result.platformSupported) {
        setUpdateCheckStatus('unsupported')
        setUpdateDownloadStatus('unsupported')
        return
      }

      setUpdateCheckStatus(result.updateAvailable ? 'available' : 'up-to-date')
    } catch (error) {
      setUpdateCheckStatus('error')
      showToast(resolveAppErrorMessage(error, 'settings:updates.toast.check_failed'), 'error')
    }
  }

  const handleDownloadUpdate = async (): Promise<void> => {
    if (!canDownloadUpdate) {
      return
    }

    setUpdateDownloadStatus('checking')
    setUpdateDownloadProgress(null)
    setPreparedUpdateCache(null)
    setDownloadCompleted(false)
    setExtractCompleted(false)

    try {
      const result = await window.api.downloadUpdate()

      if (!result.success) {
        setUpdateDownloadStatus('error')
        showToast(resolveAppErrorMessage(result.error, 'settings:updates.toast.download_failed'), 'error')
      }
    } catch (error) {
      setUpdateDownloadStatus('error')
      showToast(resolveAppErrorMessage(error, 'settings:updates.toast.download_failed'), 'error')
    }
  }

  const handleApplyUpdate = async (): Promise<void> => {
    if (!canApplyUpdate) {
      return
    }

    setApplyInFlight(true)
    setUpdateDownloadStatus('applying')

    try {
      const result = await window.api.applyUpdate()

      if (!result.success) {
        setApplyInFlight(false)
        setUpdateDownloadStatus('completed')
      }
    } catch (error) {
      setApplyInFlight(false)
      setUpdateDownloadStatus('completed')
      showToast(resolveAppErrorMessage(error, 'settings:updates.toast.apply_failed'), 'error')
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Stack sx={{ width: '100%', maxWidth: 1400, p: 3 }} spacing={3}>
        {/* Header */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <SettingsOutlinedIcon sx={{ fontSize: 20, color: 'primary.contrastText' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} lineHeight={1.1}>
              {t('header.title')}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {t('header.description')}
            </Typography>
          </Box>
        </Stack>

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
            <Typography
              variant="overline"
              fontWeight={700}
              color="text.secondary"
              letterSpacing={1.5}
            >
              {t('updates.section_title')}
            </Typography>
          </Stack>

          <Divider />

          <Stack divider={<Divider />}>
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

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={2}
              sx={{ px: 3, py: 2.5 }}
            >
              <Stack spacing={0.4}>
                <Typography variant="body2" fontWeight={700}>
                  {t('updates.platform.title')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('updates.platform.description')}
                </Typography>
              </Stack>

              <Typography variant="body2" fontWeight={700}>
                {runtimeInfo ? resolvePlatformLabel(runtimeInfo.platform, t) : '-'}
              </Typography>
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={2}
              sx={{ px: 3, py: 2.5 }}
            >
              <Stack spacing={0.4}>
                <Typography variant="body2" fontWeight={700}>
                  {t('updates.latest_version.title')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('updates.latest_version.description')}
                </Typography>
                {publishedAtLabel && (
                  <Typography variant="caption" color="text.secondary">
                    {t('updates.latest_version.published_at', { date: publishedAtLabel })}
                  </Typography>
                )}
              </Stack>

              <Stack spacing={1} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
                <Typography variant="body2" fontWeight={700}>
                  {latestVersionValue}
                </Typography>
                <Chip
                  label={updateCheckStatusText}
                  size="small"
                  color={resolveUpdateStatusChipColor(updateCheckStatus)}
                  variant={updateCheckStatus === 'available' ? 'filled' : 'outlined'}
                  sx={{ maxWidth: '100%' }}
                />
              </Stack>
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={2}
              sx={{ px: 3, py: 2.5 }}
            >
              <Stack spacing={0.4}>
                <Typography variant="body2" fontWeight={700}>
                  {t('updates.download.title')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {preparedUpdateCache
                    ? t('updates.apply.description')
                    : isWindowsPlatform
                      ? t('updates.download.description')
                      : t('updates.message.unsupported')}
                </Typography>
                {preparedUpdateCache && (
                  <Typography variant="caption" color="text.secondary">
                    {t('updates.apply.notice', {
                      version: preparedUpdateCache.latestVersion
                    })}
                  </Typography>
                )}
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                <Button
                  variant="outlined"
                  disabled={!runtimeInfo || !isWindowsPlatform || updateCheckStatus === 'checking'}
                  onClick={() => {
                    void handleCheckForUpdates()
                  }}
                >
                  {updateCheckStatus === 'checking'
                    ? t('updates.actions.checking')
                    : t('updates.actions.check')}
                </Button>
                <Button
                  variant="contained"
                  disabled={!canDownloadUpdate && !canApplyUpdate}
                  onClick={() => {
                    if (canApplyUpdate) {
                      void handleApplyUpdate()
                      return
                    }

                    void handleDownloadUpdate()
                  }}
                >
                  {updateDownloadStatus === 'applying'
                    ? t('updates.actions.applying')
                    : canApplyUpdate
                      ? t('updates.actions.apply')
                      : updateDownloadStatus === 'checking' ||
                          updateDownloadStatus === 'downloading' ||
                          updateDownloadStatus === 'extracting'
                        ? t('updates.actions.downloading')
                        : t('updates.actions.download')}
                </Button>
              </Stack>
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={2}
              sx={{ px: 3, py: 2.5 }}
            >
              <Stack spacing={0.4}>
                <Typography variant="body2" fontWeight={700}>
                  {t('updates.download_status.title')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('updates.download_status.description')}
                </Typography>
                {(updateResult?.assetName || preparedUpdateCache?.assetName) && (
                  <Typography variant="caption" color="text.secondary">
                    {t('updates.download_status.asset_name', {
                      assetName: preparedUpdateCache?.assetName ?? updateResult?.assetName ?? '-'
                    })}
                  </Typography>
                )}
                {preparedUpdateCache && (
                  <Typography variant="caption" color="text.secondary">
                    {t('updates.download_status.apply_ready')}
                  </Typography>
                )}
              </Stack>

              <Chip
                label={downloadStatusText}
                size="small"
                color={resolveDownloadStatusChipColor(updateDownloadStatus)}
                variant={updateDownloadStatus === 'completed' ? 'filled' : 'outlined'}
              />
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={2}
              sx={{ px: 3, py: 2.5 }}
            >
              <Stack spacing={0.75} sx={{ width: '100%', maxWidth: 420 }}>
                <Typography variant="body2" fontWeight={700}>
                  {t('updates.progress.title')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('updates.progress.description')}
                </Typography>
                {(updateDownloadStatus === 'downloading' ||
                  updateDownloadStatus === 'extracting' ||
                  updateDownloadStatus === 'completed') && (
                  <LinearProgress
                    variant={
                      updateDownloadProgress?.percent != null &&
                      updateDownloadStatus !== 'extracting'
                        ? 'determinate'
                        : 'indeterminate'
                    }
                    value={updateDownloadProgress?.percent ?? 0}
                    sx={{
                      mt: 0.5,
                      height: 6,
                      borderRadius: 999,
                      bgcolor: 'action.hover'
                    }}
                  />
                )}
              </Stack>

              <Typography variant="body2" fontWeight={700} sx={{ textAlign: { sm: 'right' } }}>
                {progressText}
              </Typography>
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={2}
              sx={{ px: 3, py: 2.5 }}
            >
              <Stack spacing={0.4}>
                <Typography variant="body2" fontWeight={700}>
                  {t('updates.ready_state.title')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('updates.ready_state.description')}
                </Typography>
                {preparedUpdateCache && (
                  <Typography variant="caption" color="text.secondary">
                    {t('updates.ready_state.next_step')}
                  </Typography>
                )}
              </Stack>

              <Stack spacing={0.75} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
                <Typography variant="caption" color="text.secondary">
                  {downloadCompleted
                    ? t('updates.ready_state.downloaded_yes')
                    : t('updates.ready_state.downloaded_no')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {extractCompleted
                    ? t('updates.ready_state.extracted_yes')
                    : t('updates.ready_state.extracted_no')}
                </Typography>
                {preparedUpdateCache && (
                  <Typography variant="caption" color="text.secondary">
                    {t('updates.ready_state.root_ready', {
                      version: preparedUpdateCache.latestVersion
                    })}
                  </Typography>
                )}
              </Stack>
            </Stack>
          </Stack>
        </Paper>

        {/* Appearance Section */}
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
                    theme.palette.primary.main,
                    0.015
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
            <Typography
              variant="overline"
              fontWeight={700}
              color="text.secondary"
              letterSpacing={1.5}
            >
              {t('appearance.section_title')}
            </Typography>
          </Stack>

          <Divider />

          <Stack divider={<Divider />} sx={{ px: 3 }}>
            <Stack sx={{ py: 2.5 }} spacing={2}>
              <Stack spacing={0.4}>
                <Typography variant="body2" fontWeight={700}>
                  {t('appearance.language.title')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('appearance.language.description')}
                </Typography>
              </Stack>

              <ToggleButtonGroup
                size="small"
                exclusive
                value={language}
                onChange={(_, next): void => {
                  if (next !== 'system' && next !== 'ko' && next !== 'en') return
                  void setSettingValue(APP_LANGUAGE_KEY, next).then((savedLanguage) => {
                    void window.api
                      .resolveAppLanguage(savedLanguage)
                      .then((resolvedLanguage) => changeLanguage(resolvedLanguage))
                  })
                }}
                sx={[TOGGLE_GROUP_SX, { width: 'fit-content' }]}
              >
                <ToggleButton value="system">
                  {t('appearance.language.options.system')}
                </ToggleButton>
                <ToggleButton value="ko">{t('appearance.language.options.ko')}</ToggleButton>
                <ToggleButton value="en">{t('appearance.language.options.en')}</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            {/* Theme: mode + preset in one block */}
            <Stack sx={{ py: 2.5 }} spacing={2.5}>
              <Stack spacing={0.4}>
                <Typography variant="body2" fontWeight={700}>
                  {t('appearance.theme.title')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('appearance.theme.description')}
                </Typography>
              </Stack>

              {/* Mode */}
              <Stack spacing={1}>
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  {t('appearance.theme.mode_label')}
                </Typography>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={themeMode}
                  onChange={(_, next): void => {
                    if (!next) return
                    if (next !== 'system' && next !== 'light' && next !== 'dark') return
                    void setSettingValue(APP_THEME_MODE_KEY, next)
                  }}
                  sx={[TOGGLE_GROUP_SX, { width: 'fit-content' }]}
                >
                  <ToggleButton value="system">{t('appearance.theme.options.system')}</ToggleButton>
                  <ToggleButton value="light">{t('appearance.theme.options.light')}</ToggleButton>
                  <ToggleButton value="dark">{t('appearance.theme.options.dark')}</ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              {/* Preset */}
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="baseline">
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color={themeMode === 'system' ? 'text.disabled' : 'text.secondary'}
                  >
                    {t('appearance.theme_preset.title')}
                  </Typography>
                  {themeMode === 'system' && (
                    <Typography variant="caption" color="text.disabled">
                      {t('appearance.theme_preset.description_system')}
                    </Typography>
                  )}
                </Stack>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={themePreset}
                  disabled={themeMode === 'system'}
                  onChange={(_, next): void => {
                    if (!next) return
                    if (!isAppThemePreset(next)) return
                    void setSettingValue(APP_THEME_PRESET_KEY, next)
                  }}
                  sx={[TOGGLE_GROUP_SX, { width: 'fit-content' }]}
                >
                  <ToggleButton value="default">
                    {t('appearance.theme_preset.options.default')}
                  </ToggleButton>
                  {themeMode === 'light' && (
                    <ToggleButton value="slate">
                      {t('appearance.theme_preset.options.slate')}
                    </ToggleButton>
                  )}
                  {themeMode === 'dark' && (
                    <ToggleButton value="ink">
                      {t('appearance.theme_preset.options.ink')}
                    </ToggleButton>
                  )}
                  {themeMode === 'dark' && (
                    <ToggleButton value="jade">
                      {t('appearance.theme_preset.options.jade')}
                    </ToggleButton>
                  )}
                  {themeMode === 'dark' && (
                    <ToggleButton value="aurora">
                      {t('appearance.theme_preset.options.aurora')}
                    </ToggleButton>
                  )}
                </ToggleButtonGroup>
              </Stack>
            </Stack>
          </Stack>
        </Paper>

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
                    0.012
                  )} 100%)`
                : theme.palette.background.paper
          }}
        >
          {/* Section header */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ px: 3, py: 2, bgcolor: 'action.hover' }}
          >
            <Typography
              variant="overline"
              fontWeight={700}
              color="text.secondary"
              letterSpacing={1.5}
            >
              {t('downloads.section_title')}
            </Typography>
          </Stack>

          <Divider />

          <Stack divider={<Divider />}>
            {/* Default format setting */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={2}
              sx={{ px: 3, py: 2.5 }}
            >
              <Stack spacing={0.4}>
                <Typography variant="body2" fontWeight={700}>
                  {t('downloads.default_type.title')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('downloads.default_type.description')}
                </Typography>
              </Stack>

              <ToggleButtonGroup
                size="small"
                exclusive
                value={defaultType}
                onChange={(_, next): void => {
                  if (!next) return
                  if (next !== 'video' && next !== 'audio') return
                  void setSettingValue(DOWNLOADS_DEFAULT_TYPE_KEY, next)
                }}
                sx={[TOGGLE_GROUP_SX, { flexShrink: 0, '& .MuiToggleButton-root': { px: 2 } }]}
              >
                <ToggleButton value="video">
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <VideoLibraryIcon sx={{ fontSize: 15 }} />
                    <span>{t('media.video')}</span>
                  </Stack>
                </ToggleButton>
                <ToggleButton value="audio">
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <AudiotrackIcon sx={{ fontSize: 15 }} />
                    <span>{t('media.audio')}</span>
                  </Stack>
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            {/* Playlist limit setting */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={2}
              sx={{ px: 3, py: 2.5 }}
            >
              <Stack spacing={0.4}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" fontWeight={700}>
                    {t('downloads.playlist_limit.title')}
                  </Typography>
                  <Chip
                    icon={<PlaylistPlayIcon sx={{ fontSize: '14px !important' }} />}
                    label={t('downloads.playlist_limit.badge', { count: playlistLimit })}
                    size="small"
                    variant="outlined"
                    color="primary"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      bgcolor: (theme) =>
                        theme.palette.mode === 'light'
                          ? alpha(theme.palette.primary.main, 0.08)
                          : undefined,
                      borderColor: (theme) =>
                        theme.palette.mode === 'light'
                          ? alpha(theme.palette.primary.main, 0.28)
                          : undefined,
                      '& .MuiChip-label': { px: 1 }
                    }}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {t('downloads.playlist_limit.description')}
                </Typography>
              </Stack>

              <ToggleButtonGroup
                size="small"
                exclusive
                value={String(playlistLimit)}
                onChange={(_, next): void => {
                  if (!next) return
                  const parsed = Number(next)
                  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) return
                  void setSettingValue(DOWNLOADS_PLAYLIST_LIMIT_KEY, parsed)
                }}
                sx={[
                  TOGGLE_GROUP_SX,
                  { flexShrink: 0, '& .MuiToggleButton-root': { px: 2.5, minWidth: 56 } }
                ]}
              >
                <ToggleButton value="10">{t('downloads.playlist_limit.options.10')}</ToggleButton>
                <ToggleButton value="20">{t('downloads.playlist_limit.options.20')}</ToggleButton>
                <ToggleButton value="40">{t('downloads.playlist_limit.options.40')}</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  )
}
