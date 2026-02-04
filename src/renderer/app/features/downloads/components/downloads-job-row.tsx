import AccessTimeIcon from '@mui/icons-material/AccessTime'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import AudiotrackIcon from '@mui/icons-material/Audiotrack'
import DeleteIcon from '@mui/icons-material/Delete'
import ErrorIcon from '@mui/icons-material/Error'
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
import type { DownloadInfo, DownloadJob } from '@src/types/download.types'
import React from 'react'

import {
  formatDuration,
  formatPercent,
  getErrorMessage,
  inferTitle,
  paletteMain,
  resolveDownloadStatus,
  statusTone
} from '../lib/downloads-utils'

const actionBtnSx = { width: 32, height: 32 } as const

export default function DownloadsJobRow(props: {
  job: DownloadJob
  isCurrent: boolean
  onToggleType: (id: string, type: 'video' | 'audio') => void
  onStop: (job: DownloadJob) => void
  onRetry: (job: DownloadJob) => void
  onDelete: (job: DownloadJob) => void
}): React.JSX.Element {
  const { job } = props
  const theme = useTheme()
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

  const percent = Math.max(0, Math.min(100, job.progress?.percent ?? 0))
  const showProgressBar = job.status === 'running'
  const errorInfo = job.error ? getErrorMessage(job.error) : null

  const statusMeta = resolveDownloadStatus(job.status)
  const StatusIcon = statusMeta.icon
  const statusMain = paletteMain(statusMeta.color)

  return (
    <Fade in>
      <Paper
        elevation={props.isCurrent ? 4 : 1}
        sx={{
          p: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: props.isCurrent ? 'primary.main' : tone.borderColor,
          backgroundColor: tone.bg,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Stack direction={'column'} spacing={2}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            {/* 썸네일 */}
            <Box
              sx={{
                width: 180,
                aspectRatio: '16/9',
                borderRadius: 2,
                overflow: 'hidden',
                flexShrink: 0,
                bgcolor: alpha(theme.palette.common.white, 0.06),
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 1,
                position: 'relative'
              }}
            >
              {thumb ? (
                <Box
                  component="img"
                  src={thumb}
                  alt=""
                  sx={{
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.action.hover, 0.5)
                  }}
                >
                  <VideoLibraryIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
                </Box>
              )}

              {/* 타입 뱃지 */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  borderRadius: 1,
                  px: 1,
                  py: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  backdropFilter: 'blur(4px)'
                }}
              >
                {job.type === 'audio' ? (
                  <AudiotrackIcon sx={{ fontSize: 12 }} />
                ) : (
                  <VideoLibraryIcon sx={{ fontSize: 12 }} />
                )}
                <Typography
                  variant="caption"
                  sx={{ fontSize: '0.65rem', fontWeight: 700, lineHeight: 1 }}
                >
                  {job.type}
                </Typography>
              </Box>
            </Box>

            {/* 컨텐츠 */}
            <Stack
              sx={{ minWidth: 0, flex: 1, height: '100%', minHeight: 90 }}
              justifyContent="space-between"
            >
              {/* 상단 정보 */}
              <Stack spacing={1}>
                <Typography
                  fontWeight={700}
                  sx={{ fontSize: '1rem', lineHeight: 1.3, mb: 0.5, mr: 1 }}
                  title={inferTitle(job)}
                  noWrap
                >
                  {inferTitle(job)}
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                  {displayChannel && (
                    <Stack direction="row" spacing={0.6} alignItems="center">
                      <AccountCircleIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        sx={{ fontSize: '0.8rem', maxWidth: 180 }}
                      >
                        {displayChannel}
                      </Typography>
                    </Stack>
                  )}

                  {durationText && (
                    <Stack direction="row" spacing={0.6} alignItems="center">
                      <AccessTimeIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: '0.8rem' }}
                      >
                        {durationText}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Stack>

              {/* 상태 + 액션 */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mt: showProgressBar ? 1 : 2 }}
              >
                <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                  {errorInfo ? (
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ color: 'error.main' }}
                    >
                      <ErrorIcon sx={{ fontSize: 16 }} />
                      <Typography
                        variant="caption"
                        noWrap
                        fontWeight={600}
                        title={errorInfo.description}
                      >
                        {errorInfo.title}
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ color: statusMain }}
                    >
                      <StatusIcon sx={{ fontSize: 16 }} />
                      <Typography variant="caption" fontWeight={600}>
                        {statusMeta.label}
                      </Typography>
                    </Stack>
                  )}
                </Box>

                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: alpha(theme.palette.action.active, 0.04),
                    borderRadius: 2,
                    p: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  <AppTooltip title={canToggle ? '형식 변경' : '변경 불가'}>
                    <ToggleButtonGroup
                      size="small"
                      exclusive
                      value={job.type}
                      disabled={!canToggle}
                      onChange={(_, v) => v && props.onToggleType(job.id, v)}
                      sx={{
                        height: 32,
                        '& .MuiToggleButton-root': {
                          border: 'none',
                          borderRadius: 1.5,
                          px: 1,
                          py: 0.5,
                          color: 'text.secondary',
                          transition: 'all 120ms ease',
                          '&.Mui-selected': {
                            bgcolor: 'rgba(255,255,255,0.12)',
                            color: 'text.primary',
                            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)'
                          },

                          '&.Mui-selected:hover': {
                            bgcolor: 'rgba(255,255,255,0.16)'
                          }
                        }
                      }}
                    >
                      <ToggleButton value="video">
                        <VideoLibraryIcon sx={{ fontSize: 16 }} />
                      </ToggleButton>
                      <ToggleButton value="audio">
                        <AudiotrackIcon sx={{ fontSize: 16 }} />
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </AppTooltip>

                  <Box sx={{ width: 1, height: 16, bgcolor: 'divider', mx: 0.5 }} />

                  <Stack direction="row" spacing={0.5}>
                    <AppTooltip title="다시 시도">
                      <IconButton
                        size="small"
                        disabled={!canRetry}
                        onClick={() => props.onRetry(job)}
                        sx={actionBtnSx}
                      >
                        <ReplayIcon fontSize="small" />
                      </IconButton>
                    </AppTooltip>

                    <AppTooltip title="중단">
                      <IconButton
                        size="small"
                        disabled={!canStop}
                        onClick={() => props.onStop(job)}
                        sx={actionBtnSx}
                      >
                        <StopIcon fontSize="small" />
                      </IconButton>
                    </AppTooltip>

                    <AppTooltip title="삭제">
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
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </AppTooltip>
                  </Stack>
                </Paper>
              </Stack>
            </Stack>
          </Stack>

          {/* 진행 */}
          <Stack direction={'column'} spacing={0.5}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1} alignItems="center">
                <StatusIcon
                  sx={{
                    fontSize: 16,
                    color: statusMain,
                    ...(job.status === 'running' && {
                      animation: 'spin 2s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                      }
                    })
                  }}
                />
                <Typography
                  variant="caption"
                  color={statusMain}
                  sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}
                >
                  {job.progress?.current ?? 'download pending...'}
                </Typography>
              </Stack>

              <Typography variant="caption" color={statusMain} fontWeight={700}>
                {formatPercent(job.progress?.percent ?? 0)}
              </Typography>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={percent}
              sx={{
                mt: 0.5,
                height: 4,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.common.white, 0.08),
                '& .MuiLinearProgress-bar': {
                  bgcolor: statusMain
                }
              }}
            />
          </Stack>
        </Stack>
      </Paper>
    </Fade>
  )
}
