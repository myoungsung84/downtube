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
            다운로드 관리
          </Typography>
          <Chip
            size="small"
            label={props.hydrating ? '불러오는 중…' : props.queueLabel}
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

        <AppTooltip title="다운로드 폴더 열기">
          <Button
            variant="text"
            size="small"
            startIcon={<FolderOpenIcon sx={{ fontSize: '18px !important' }} />}
            onClick={props.onOpenDir}
            sx={{ fontWeight: 600, fontSize: '0.8rem', borderRadius: 1.5, color: 'text.secondary' }}
          >
            폴더 열기
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
              label={`전체 ${props.jobsTotal}`}
              variant="filled"
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            />
            {props.queuedCount > 0 && (
              <Chip
                size="small"
                label={`대기 ${props.queuedCount}`}
                variant="outlined"
                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
              />
            )}
            {props.runningCount > 0 && (
              <Chip
                size="small"
                icon={<DownloadingIcon sx={{ fontSize: '14px !important' }} />}
                label={`진행중 ${props.runningCount}`}
                color="info"
                variant="filled"
                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
              />
            )}
            {props.completedCount > 0 && (
              <Chip
                size="small"
                icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                label={`완료 ${props.completedCount}`}
                color="success"
                variant="filled"
                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
              />
            )}
            {props.failedCount > 0 && (
              <Chip
                size="small"
                icon={<ErrorIcon sx={{ fontSize: '14px !important' }} />}
                label={`실패 ${props.failedCount}`}
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
                  ? '먼저 영상 URL을 추가해주세요'
                  : props.queuePaused
                    ? '일시정지된 다운로드를 계속합니다'
                    : '대기중인 다운로드를 시작합니다'
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
                {props.queuePaused && props.hasQueued ? '계속하기' : '다운로드 시작'}
              </Button>
            </AppTooltip>
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <AppTooltip fullWidth title="진행중인 다운로드를 일시정지합니다">
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
                일시정지
              </Button>
            </AppTooltip>
          </Box>
        </Stack>
      </Stack>
    </Paper>
  )
}
