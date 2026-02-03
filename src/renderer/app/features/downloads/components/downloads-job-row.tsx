import AudiotrackIcon from '@mui/icons-material/Audiotrack'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import DownloadingIcon from '@mui/icons-material/Downloading'
import ErrorIcon from '@mui/icons-material/Error'
import ReplayIcon from '@mui/icons-material/Replay'
import StopIcon from '@mui/icons-material/Stop'
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary'
import WarningIcon from '@mui/icons-material/Warning'
import {
  Alert,
  AlertTitle,
  alpha,
  Box,
  Button,
  Chip,
  Collapse,
  Fade,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material'
import type { DownloadInfo, DownloadJob } from '@src/types/download.types'
import React, { useState } from 'react'

import {
  formatDuration,
  formatPercent,
  getErrorMessage,
  inferTitle,
  statusLabel,
  statusTone
} from '../lib/downloads-utils'

const actionBtnSx = { width: 36, height: 36 } as const

export default function DownloadsJobRow(props: {
  job: DownloadJob
  isCurrent: boolean
  onToggleType: (id: string, type: 'video' | 'audio') => void
  onStop: (job: DownloadJob) => void
  onRetry: (job: DownloadJob) => void
  onDelete: (job: DownloadJob) => void
}): React.JSX.Element {
  const { job } = props
  const tone = statusTone(job.status)
  const [showDetails, setShowDetails] = useState(false)

  const info: DownloadInfo | undefined = job.info
  const thumb = info?.thumbnail
  const uploader = info?.uploader
  const channel = info?.channel
  const durationText = info?.duration != null ? formatDuration(info.duration) : undefined

  const canToggle = job.status === 'queued'
  const canStop = job.status === 'queued' || job.status === 'running'
  const canRetry = job.status === 'failed' || job.status === 'cancelled'
  const canDelete = job.status !== 'running'

  const percent = Math.max(0, Math.min(100, job.progress?.percent ?? 0))
  const showProgressBar = job.status === 'running'
  const errorInfo = job.error ? getErrorMessage(job.error) : null

  const chips: Array<{
    label: string
    tone?: 'default' | 'success' | 'error' | 'warning' | 'info'
  }> = []

  if (info?.extractor) chips.push({ label: `${info.extractor}`, tone: 'default' })
  if (info?.formatsCount != null)
    chips.push({ label: `${info.formatsCount} formats`, tone: 'default' })
  if (info?.isLive != null) {
    chips.push({ label: info.isLive ? 'LIVE' : 'VOD', tone: info.isLive ? 'warning' : 'default' })
  }
  if (info?.availability) {
    const av = info.availability.toLowerCase()
    const toneHint: 'default' | 'warning' | 'error' = av.includes('private')
      ? 'error'
      : av.includes('unavailable')
        ? 'error'
        : av.includes('unlisted')
          ? 'warning'
          : 'default'
    chips.push({ label: info.availability, tone: toneHint })
  }

  const metaLine1 = [uploader, channel].filter(Boolean).join(' · ')
  const metaLine2 = [durationText ? `${durationText}` : null, info?.id ? `ID: ${info.id}` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <Fade in>
      <Paper
        elevation={props.isCurrent ? 6 : 2}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: '2px solid',
          borderColor: props.isCurrent ? 'primary.main' : tone.borderColor,
          backgroundColor: tone.bg,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Stack spacing={2}>
          <Stack
            direction="row"
            spacing={2.5}
            alignItems="flex-start"
            justifyContent="space-between"
          >
            <Stack spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: 2,
                    overflow: 'hidden',
                    flexShrink: 0,
                    bgcolor: (theme) => alpha(theme.palette.common.white, 0.06),
                    border: '2px solid',
                    borderColor: 'divider',
                    boxShadow: 2
                  }}
                >
                  {thumb ? (
                    <Box
                      component="img"
                      src={thumb}
                      alt=""
                      sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: (theme) => alpha(theme.palette.action.hover, 0.5)
                      }}
                    >
                      <VideoLibraryIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
                    </Box>
                  )}
                </Box>

                <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                    {job.status === 'running' ? (
                      <DownloadingIcon
                        sx={{
                          color: 'primary.main',
                          fontSize: 22,
                          animation: 'spin 2s linear infinite',
                          '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' }
                          }
                        }}
                      />
                    ) : job.status === 'completed' ? (
                      <CheckCircleIcon sx={{ color: 'success.main', fontSize: 22 }} />
                    ) : job.status === 'failed' ? (
                      <ErrorIcon sx={{ color: 'error.main', fontSize: 22 }} />
                    ) : job.status === 'cancelled' ? (
                      <WarningIcon sx={{ color: 'warning.main', fontSize: 22 }} />
                    ) : (
                      <DownloadIcon sx={{ color: 'action.active', fontSize: 22 }} />
                    )}

                    <Typography
                      noWrap
                      fontWeight={700}
                      sx={{ minWidth: 0, fontSize: '1rem', flex: 1 }}
                      title={inferTitle(job)}
                    >
                      {inferTitle(job)}
                    </Typography>

                    <Chip
                      size="small"
                      label={statusLabel(job.status)}
                      color={tone.chipColor ?? 'default'}
                      variant="filled"
                      sx={{ fontWeight: 700, px: 1.5 }}
                    />
                  </Stack>

                  {metaLine1 ? (
                    <Typography
                      noWrap
                      variant="body2"
                      sx={{ opacity: 0.75, fontSize: '0.85rem', pl: 3.5 }}
                      title={metaLine1}
                    >
                      {metaLine1}
                    </Typography>
                  ) : null}

                  {metaLine2 ? (
                    <Typography
                      noWrap
                      variant="body2"
                      sx={{ opacity: 0.6, fontSize: '0.8rem', pl: 3.5 }}
                      title={metaLine2}
                    >
                      {metaLine2}
                    </Typography>
                  ) : null}

                  <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 3.5 }}>
                    <Chip
                      size="small"
                      icon={
                        job.type === 'audio' ? (
                          <AudiotrackIcon sx={{ fontSize: 14 }} />
                        ) : (
                          <VideoLibraryIcon sx={{ fontSize: 14 }} />
                        )
                      }
                      label={job.type === 'audio' ? '오디오' : '비디오'}
                      color={job.type === 'audio' ? 'info' : 'default'}
                      variant="outlined"
                      sx={{ fontWeight: 600, height: 24 }}
                    />

                    {chips.length > 0 && showDetails ? (
                      <>
                        {chips.map((c, idx) => (
                          <Chip
                            key={`${c.label}-${idx}`}
                            size="small"
                            label={c.label}
                            color={c.tone ?? 'default'}
                            variant="outlined"
                            sx={{ height: 24, fontWeight: 500 }}
                          />
                        ))}
                      </>
                    ) : null}

                    {chips.length > 0 ? (
                      <Button
                        size="small"
                        onClick={() => setShowDetails(!showDetails)}
                        sx={{ minWidth: 'auto', px: 1, fontSize: '0.75rem' }}
                      >
                        {showDetails ? '간단히' : '자세히'}
                      </Button>
                    ) : null}
                  </Stack>
                </Stack>
              </Stack>

              {job.status === 'running' && job.progress?.current ? (
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ pl: 10.5 }}>
                  <Typography
                    variant="body2"
                    color="primary"
                    fontWeight={700}
                    sx={{ fontSize: '0.875rem' }}
                  >
                    {job.progress.current}
                  </Typography>
                  <Chip
                    size="small"
                    label={formatPercent(job.progress.percent)}
                    color="primary"
                    variant="filled"
                    sx={{ fontWeight: 700, height: 22 }}
                  />
                </Stack>
              ) : null}
            </Stack>

            <Stack spacing={1.5} alignItems="flex-end">
              <Stack direction="row" spacing={1}>
                <Tooltip
                  title={canToggle ? '비디오 또는 오디오만 선택' : '대기중인 항목만 변경 가능'}
                >
                  <span>
                    <ToggleButtonGroup
                      size="small"
                      exclusive
                      value={job.type}
                      disabled={!canToggle}
                      onChange={(_, v) => {
                        if (!v) return
                        props.onToggleType(job.id, v)
                      }}
                      sx={{
                        '& .MuiToggleButton-root': {
                          px: 1.5,
                          py: 0.75,
                          fontWeight: 600,
                          fontSize: '0.8rem'
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
                  </span>
                </Tooltip>
              </Stack>

              <Stack direction="row" spacing={1}>
                <Tooltip title="다시 시도">
                  <span>
                    <IconButton
                      sx={{ ...actionBtnSx, bgcolor: 'action.hover' }}
                      disabled={!canRetry}
                      onClick={() => void props.onRetry(job)}
                    >
                      <ReplayIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title="중단">
                  <span>
                    <IconButton
                      sx={{ ...actionBtnSx, bgcolor: 'action.hover' }}
                      disabled={!canStop}
                      onClick={() => void props.onStop(job)}
                    >
                      <StopIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title="삭제">
                  <span>
                    <IconButton
                      sx={{ ...actionBtnSx, bgcolor: 'action.hover' }}
                      disabled={!canDelete}
                      onClick={() => void props.onDelete(job)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Stack>
          </Stack>

          {showProgressBar ? (
            <Box sx={{ px: 10.5 }}>
              <LinearProgress
                variant="determinate"
                value={percent}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: (theme) =>
                      `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`
                  }
                }}
              />
            </Box>
          ) : null}

          {errorInfo ? (
            <Alert
              severity="error"
              variant="outlined"
              sx={{ borderRadius: 2, borderWidth: 2, '& .MuiAlert-icon': { fontSize: 22 } }}
            >
              <AlertTitle sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {errorInfo.title}
              </AlertTitle>
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                {errorInfo.description}
              </Typography>
            </Alert>
          ) : null}

          {job.status === 'completed' ? (
            <Alert
              severity="success"
              variant="filled"
              icon={<CheckCircleIcon fontSize="medium" />}
              sx={{ borderRadius: 2, boxShadow: 2, '& .MuiAlert-icon': { fontSize: 22 } }}
            >
              <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                ✨ 다운로드 완료! 저장 폴더에서 확인하세요
              </Typography>
            </Alert>
          ) : null}

          {showDetails ? (
            <Collapse in>
              <Box sx={{ pl: 10.5, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.6,
                    fontSize: '0.8rem',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace'
                  }}
                >
                  {job.url}
                </Typography>
              </Box>
            </Collapse>
          ) : null}
        </Stack>
      </Paper>
    </Fade>
  )
}
