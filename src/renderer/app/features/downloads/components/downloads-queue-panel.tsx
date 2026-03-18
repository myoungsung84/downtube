import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DownloadIcon from '@mui/icons-material/Download'
import DownloadingIcon from '@mui/icons-material/Downloading'
import ErrorIcon from '@mui/icons-material/Error'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { Box, Button, Chip, Divider, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import AppTooltip from '@renderer/shared/components/ui/app-tooltip'
import { useI18n } from '@renderer/shared/hooks/use-i18n'
import React from 'react'

export default function DownloadsQueuePanel(props: {
  jobsTotal: number
  queuedCount: number
  runningCount: number
  completedCount: number
  failedCount: number

  queueLabel: string
  queueRunning: boolean
  queuePaused: boolean
  hasQueued: boolean
  canStart: boolean
  canPause: boolean
  hydrating: boolean

  onOpenDir: () => void
  onStartQueue: () => void
  onPauseQueue: () => void
}): React.JSX.Element {
  const { t } = useI18n('downloads')
  const isActive = props.queueRunning && !props.queuePaused

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
                theme.palette.primary.main,
                0.012
              )} 100%)`
            : theme.palette.background.paper
      }}
    >
      {/* Header row */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2.5,
          py: 1.75,
          bgcolor: (theme) =>
            theme.palette.mode === 'light'
              ? alpha(theme.palette.primary.main, 0.05)
              : theme.palette.action.hover
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <DownloadingIcon sx={{ fontSize: 20, color: 'primary.main' }} />
          <Typography variant="body1" fontWeight={700}>
            {t('queue.title')}
          </Typography>
          <Chip
            size="small"
            label={props.hydrating ? t('queue.loading') : props.queueLabel}
            color={isActive ? 'primary' : 'default'}
            variant={isActive ? 'filled' : 'outlined'}
            icon={isActive ? <DownloadIcon sx={{ fontSize: '14px !important' }} /> : undefined}
            sx={{
              fontWeight: 600,
              height: 22,
              fontSize: '0.72rem',
              borderColor: (theme) =>
                theme.palette.mode === 'light'
                  ? alpha(theme.palette.primary.main, 0.24)
                  : undefined,
              '& .MuiChip-label': { px: 1 }
            }}
          />
        </Stack>

        <AppTooltip title={t('queue.actions.open_folder')}>
          <Button
            variant="text"
            size="small"
            startIcon={<FolderOpenIcon sx={{ fontSize: '18px !important' }} />}
            onClick={props.onOpenDir}
            sx={{ fontWeight: 600, fontSize: '0.8rem', borderRadius: 1.5, color: 'text.secondary' }}
          >
            {t('queue.actions.open_folder')}
          </Button>
        </AppTooltip>
      </Stack>

      <Divider />

      <Stack spacing={2.5} sx={{ p: 2.5 }}>
        {/* Stats row */}
        {props.jobsTotal > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              size="small"
              label={t('queue.stats.total', { count: props.jobsTotal })}
              variant="filled"
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            />
            {props.queuedCount > 0 && (
              <Chip
                size="small"
                label={t('queue.stats.queued', { count: props.queuedCount })}
                variant="outlined"
                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
              />
            )}
            {props.runningCount > 0 && (
              <Chip
                size="small"
                icon={<DownloadingIcon sx={{ fontSize: '14px !important' }} />}
                label={t('queue.stats.running', { count: props.runningCount })}
                color="info"
                variant="filled"
                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
              />
            )}
            {props.completedCount > 0 && (
              <Chip
                size="small"
                icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                label={t('queue.stats.completed', { count: props.completedCount })}
                color="success"
                variant="filled"
                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
              />
            )}
            {props.failedCount > 0 && (
              <Chip
                size="small"
                icon={<ErrorIcon sx={{ fontSize: '14px !important' }} />}
                label={t('queue.stats.failed', { count: props.failedCount })}
                color="error"
                variant="filled"
                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
              />
            )}
          </Stack>
        )}

        {/* Action buttons */}
        <Stack direction="row" spacing={1.5}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <AppTooltip
              fullWidth
              title={
                !props.hasQueued
                  ? t('queue.tooltips.require_url')
                  : props.queuePaused
                    ? t('queue.tooltips.resume')
                    : t('queue.tooltips.start')
              }
            >
              <Button
                size="large"
                variant="contained"
                fullWidth
                disableElevation
                startIcon={<PlayArrowIcon />}
                disabled={!props.canStart}
                onClick={props.onStartQueue}
                sx={{
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  borderRadius: 2
                }}
              >
                {props.queuePaused && props.hasQueued
                  ? t('queue.actions.resume')
                  : t('queue.actions.start')}
              </Button>
            </AppTooltip>
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <AppTooltip fullWidth title={t('queue.tooltips.pause')}>
              <Button
                size="large"
                variant="outlined"
                fullWidth
                startIcon={<PauseIcon />}
                disabled={!props.canPause}
                onClick={props.onPauseQueue}
                sx={{
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  borderRadius: 2
                }}
              >
                {t('queue.actions.pause')}
              </Button>
            </AppTooltip>
          </Box>
        </Stack>
      </Stack>
    </Paper>
  )
}
