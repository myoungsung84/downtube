import AccessTimeIcon from '@mui/icons-material/AccessTime'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import AudiotrackIcon from '@mui/icons-material/Audiotrack'
import DeleteIcon from '@mui/icons-material/Delete'
import ErrorIcon from '@mui/icons-material/Error'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ReplayIcon from '@mui/icons-material/Replay'
import StopIcon from '@mui/icons-material/Stop'
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary'
import {
  alpha,
  Box,
  Fade,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme
} from '@mui/material'
import AppTooltip from '@renderer/shared/components/ui/app-tooltip'
import Thumbnail from '@renderer/shared/components/ui/thumbnail'
import { useI18n } from '@renderer/shared/hooks/use-i18n'
import { resolveAppErrorDetail, resolveAppErrorMessage } from '@renderer/shared/lib/app-error'
import type { DownloadInfo, DownloadJob } from '@src/types/download.types'
import clamp from 'lodash/clamp'
import React from 'react'

import {
  formatDuration,
  formatPercent,
  inferTitle,
  resolveDownloadStatus,
  statusTone
} from '../lib/downloads-utils'

const actionBtnSx = { width: 32, height: 32 } as const

const STATUS_BG_ALPHA: Record<
  'primary' | 'success' | 'error' | 'warning',
  { light: number; dark: number }
> = {
  primary: { light: 0.06, dark: 0.12 },
  success: { light: 0.08, dark: 0.1 },
  error: { light: 0.08, dark: 0.1 },
  warning: { light: 0.09, dark: 0.1 }
}

export default function DownloadsJobRow(props: {
  job: DownloadJob
  isCurrent: boolean
  onToggleType: (id: string, type: 'video' | 'audio') => void
  onStop: (job: DownloadJob) => void
  onRetry: (job: DownloadJob) => void
  onDelete: (job: DownloadJob) => void
  onPlay: (job: DownloadJob) => void
}): React.JSX.Element {
  const { job } = props
  const theme = useTheme()
  const { t } = useI18n('downloads')
  const tone = statusTone(job.status)

  const info: DownloadInfo | undefined = job.info
  const thumb = info?.thumbnail
  const uploader = info?.uploader
  const channel = info?.channel
  const displayChannel = channel || uploader
  const durationText = info?.duration != null ? formatDuration(info.duration) : undefined

  const canToggle = job.status === 'queued'
  const canStop = job.status === 'queued' || job.status === 'running'
  const canRetry = job.status === 'failed' || job.status === 'cancelled'
  const canDelete = job.status !== 'running'
  const canPlay = job.status === 'completed' && Boolean(job.finalFilePath ?? job.outputFile)

  const percent = clamp(job.progress?.percent ?? 0, 0, 100)
  const errorMessage = job.error ? resolveAppErrorMessage(job.error) : null

  const statusMeta = resolveDownloadStatus(job.status)
  const StatusIcon = statusMeta.icon
  const statusMain =
    statusMeta.color === 'default'
      ? theme.palette.text.secondary
      : theme.palette[statusMeta.color].main
  const statusBg = tone.bgPaletteKey
    ? alpha(
        theme.palette[tone.bgPaletteKey].main,
        STATUS_BG_ALPHA[tone.bgPaletteKey][theme.palette.mode]
      )
    : 'transparent'

  return (
    <Fade in>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: props.isCurrent ? 'primary.main' : tone.borderColor,
          backgroundColor: statusBg,
          overflow: 'hidden'
        }}
      >
        <Stack direction="row" sx={{ minHeight: 100 }}>
          <Box
            sx={{
              width: 168,
              flexShrink: 0,
              p: 1.25,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16 / 9',
                flex: '0 0 auto'
              }}
            >
              <Thumbnail
                url={thumb}
                w="100%"
                h="100%"
                alt={inferTitle(job)}
                sx={{
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: alpha(theme.palette.common.black, 0.08)
                }}
              />

              <Box
                sx={{
                  position: 'absolute',
                  bottom: 6,
                  right: 6,
                  bgcolor: alpha(
                    theme.palette.common.black,
                    theme.palette.mode === 'dark' ? 0.72 : 0.62
                  ),
                  color: 'common.white',
                  borderRadius: 0.75,
                  px: 0.75,
                  py: 0.25,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  backdropFilter: 'blur(4px)'
                }}
              >
                {job.type === 'audio' ? (
                  <AudiotrackIcon sx={{ fontSize: 11 }} />
                ) : (
                  <VideoLibraryIcon sx={{ fontSize: 11 }} />
                )}
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, lineHeight: 1 }}>
                  {t(job.type === 'audio' ? 'media.audio' : 'media.video')}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Stack sx={{ flex: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              sx={{ px: 2, pt: 1.75, pb: 1 }}
            >
              <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1, mr: 2 }}>
                <Typography
                  fontWeight={700}
                  noWrap
                  title={inferTitle(job)}
                  sx={{ fontSize: '0.9rem', lineHeight: 1.35 }}
                >
                  {inferTitle(job)}
                </Typography>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  {displayChannel && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <AccountCircleIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        sx={{ maxWidth: 160 }}
                      >
                        {displayChannel}
                      </Typography>
                    </Stack>
                  )}
                  {durationText && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <AccessTimeIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.secondary">
                        {durationText}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={0.25} flexShrink={0}>
                <AppTooltip
                  title={
                    canToggle
                      ? t('job.tooltips.change_type')
                      : t('job.tooltips.change_type_disabled')
                  }
                >
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={job.type}
                    disabled={!canToggle}
                    onChange={(_, v) => v && props.onToggleType(job.id, v)}
                    sx={{
                      height: 30,
                      bgcolor:
                        theme.palette.mode === 'light'
                          ? alpha(theme.palette.primary.main, 0.04)
                          : alpha(theme.palette.action.active, 0.04),
                      borderRadius: 1.5,
                      p: 0.375,
                      gap: 0.375,
                      '& .MuiToggleButtonGroup-grouped': {
                        border: 'none !important',
                        borderRadius: '6px !important',
                        margin: '0 !important'
                      },
                      '& .MuiToggleButton-root': {
                        px: 0.875,
                        borderRadius: '6px !important',
                        color: 'text.disabled',
                        '&.Mui-selected': {
                          bgcolor: 'background.paper',
                          color: 'text.primary',
                          borderRadius: '6px !important',
                          boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.2)}`
                        }
                      }
                    }}
                  >
                    <ToggleButton value="video">
                      <VideoLibraryIcon sx={{ fontSize: 14 }} />
                    </ToggleButton>
                    <ToggleButton value="audio">
                      <AudiotrackIcon sx={{ fontSize: 14 }} />
                    </ToggleButton>
                  </ToggleButtonGroup>
                </AppTooltip>

                <Box sx={{ width: 1, height: 14, bgcolor: 'divider', mx: 0.75 }} />

                <Box sx={{ width: 32, height: 32, flexShrink: 0 }}>
                  {canPlay ? (
                    <AppTooltip title={t('job.tooltips.play')}>
                      <IconButton size="small" onClick={() => props.onPlay(job)} sx={actionBtnSx}>
                        <PlayArrowIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </AppTooltip>
                  ) : null}
                </Box>

                <AppTooltip title={t('job.tooltips.retry')}>
                  <IconButton
                    size="small"
                    disabled={!canRetry}
                    onClick={() => props.onRetry(job)}
                    sx={actionBtnSx}
                  >
                    <ReplayIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </AppTooltip>

                <AppTooltip title={t('job.tooltips.stop')}>
                  <IconButton
                    size="small"
                    disabled={!canStop}
                    onClick={() => props.onStop(job)}
                    sx={actionBtnSx}
                  >
                    <StopIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </AppTooltip>

                <AppTooltip title={t('job.tooltips.delete')}>
                  <IconButton
                    size="small"
                    disabled={!canDelete}
                    onClick={() => props.onDelete(job)}
                    sx={{
                      ...actionBtnSx,
                      '&:hover': {
                        color: 'error.main',
                        bgcolor: alpha(theme.palette.error.main, 0.1)
                      }
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </AppTooltip>
              </Stack>
            </Stack>

            <Stack sx={{ px: 2, pb: 1.5 }} spacing={0.75}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                {errorMessage ? (
                  <Stack
                    direction="row"
                    spacing={0.75}
                    alignItems="center"
                    sx={{ color: 'error.main' }}
                  >
                    <ErrorIcon sx={{ fontSize: 14 }} />
                    <Typography
                      variant="caption"
                      noWrap
                      fontWeight={600}
                      title={resolveAppErrorDetail(job.error) ?? errorMessage}
                    >
                      {errorMessage}
                    </Typography>
                  </Stack>
                ) : (
                  <Stack
                    direction="row"
                    spacing={0.75}
                    alignItems="center"
                    sx={{ color: statusMain }}
                  >
                    <StatusIcon
                      sx={{
                        fontSize: 14,
                        ...(job.status === 'running' && {
                          animation: 'spin 2s linear infinite',
                          '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' }
                          }
                        })
                      }}
                    />
                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.75rem' }}>
                      {job.status === 'running'
                        ? (job.progress?.current ?? t(statusMeta.labelKey as never))
                        : t(statusMeta.labelKey as never)}
                    </Typography>
                  </Stack>
                )}

                {job.status === 'running' && (
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{ color: statusMain, fontSize: '0.75rem' }}
                  >
                    {formatPercent(job.progress?.percent ?? 0)}
                  </Typography>
                )}
              </Stack>

              <LinearProgress
                variant="determinate"
                value={job.status === 'running' ? percent : job.status === 'completed' ? 100 : 0}
                sx={{
                  height: 3,
                  borderRadius: 2,
                  bgcolor: alpha(statusMain, 0.12),
                  '& .MuiLinearProgress-bar': { bgcolor: statusMain }
                }}
              />
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </Fade>
  )
}
