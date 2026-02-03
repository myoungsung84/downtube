import AudiotrackIcon from '@mui/icons-material/Audiotrack'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DownloadIcon from '@mui/icons-material/Download'
import DownloadingIcon from '@mui/icons-material/Downloading'
import ErrorIcon from '@mui/icons-material/Error'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import SearchIcon from '@mui/icons-material/Search'
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary'
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  Fade,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material'
import NavigationBar from '@renderer/shared/components/ui/navigation-bar'
import { useToast } from '@renderer/shared/hooks/use-toast'
import type { DownloadJob, DownloadQueueEvent } from '@src/types/download.types'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import DownloadsJobRow from '../components/downloads-job-row'
import DownloadsJobRowSkeleton from '../components/downloads-job-row-skeleton'
import { getErrorMessage, inferTitle, isPlaylistUrl, sortJobs } from '../lib/downloads-utils'

export default function DownloadsScreen(): React.JSX.Element {
  const refUrl = useRef<HTMLInputElement>(null)

  const { showToast } = useToast()

  const [jobs, setJobs] = useState<DownloadJob[]>([])
  const [hydrating, setHydrating] = useState(true)

  const [queueRunning, setQueueRunning] = useState(false)
  const [queuePaused, setQueuePaused] = useState(true)
  const [currentJobId, setCurrentJobId] = useState<string | undefined>(undefined)

  const [defaultType, setDefaultType] = useState<'video' | 'audio'>('video')
  const [playlistLimit, setPlaylistLimit] = useState(10)

  const [submitting, setSubmitting] = useState<null | { url: string; kind: 'playlist' | 'single' }>(
    null
  )
  const [showAdvanced, setShowAdvanced] = useState(false)

  const queuedCount = useMemo(() => jobs.filter((j) => j.status === 'queued').length, [jobs])
  const hasQueued = queuedCount > 0
  const runningCount = useMemo(() => jobs.filter((j) => j.status === 'running').length, [jobs])
  const completedCount = useMemo(() => jobs.filter((j) => j.status === 'completed').length, [jobs])
  const failedCount = useMemo(() => jobs.filter((j) => j.status === 'failed').length, [jobs])

  const queueLabel = useMemo(() => {
    if (queueRunning && queuePaused) return '일시정지 처리중...'
    if (queueRunning) return '다운로드 진행중'
    if (queuePaused && hasQueued) return '일시정지됨'
    if (hasQueued) return '대기중'
    return '준비됨'
  }, [queueRunning, queuePaused, hasQueued])

  const canStart = hasQueued && (!queueRunning || queuePaused)
  const canPause = queueRunning && !queuePaused

  const handleDownloadInfo = async (inputUrl: string): Promise<void> => {
    const url = inputUrl.trim()
    if (!url) {
      showToast('URL을 입력해주세요', 'warning')
      return
    }

    const kind: 'playlist' | 'single' = isPlaylistUrl(url) ? 'playlist' : 'single'
    setSubmitting({ url, kind })

    try {
      if (kind === 'playlist') {
        await window.api.downloadPlaylist({
          url,
          type: defaultType,
          playlistLimit: Math.max(1, Math.min(500, playlistLimit))
        })
        showToast(
          `플레이리스트 ${playlistLimit}개 항목을 추가했어요! 아래 "시작" 버튼을 눌러보세요 🚀`,
          'success'
        )
      } else {
        if (defaultType === 'audio') await window.api.downloadAudio(url)
        else await window.api.download(url)

        showToast('다운로드 목록에 추가했어요! 아래 "시작" 버튼을 눌러보세요 🎉', 'success')
      }

      if (refUrl.current) refUrl.current.value = ''
    } catch {
      showToast('URL을 추가하는데 실패했어요. 주소를 확인해주세요 😢', 'error')
    } finally {
      setSubmitting(null)
    }
  }

  const handleToggleType = async (jobId: string, type: 'video' | 'audio'): Promise<void> => {
    await window.api.setDownloadType({ id: jobId, type })
    showToast(`${type === 'audio' ? '오디오' : '비디오'}로 변경했어요`, 'info')
  }

  const handleStop = async (job: DownloadJob): Promise<void> => {
    await window.api.stopDownload(job.url)
    showToast('다운로드를 중단했어요', 'info')
  }

  const handleRetry = async (job: DownloadJob): Promise<void> => {
    if (job.status === 'cancelled') await window.api.removeDownload(job.id)

    const kind: 'playlist' | 'single' = isPlaylistUrl(job.url) ? 'playlist' : 'single'
    setSubmitting({ url: job.url, kind })

    try {
      if (kind === 'playlist') {
        await window.api.downloadPlaylist({
          url: job.url,
          type: job.type,
          playlistLimit: Math.max(1, Math.min(500, playlistLimit))
        })
      } else if (job.type === 'audio') {
        await window.api.downloadAudio(job.url)
      } else {
        await window.api.download(job.url)
      }

      showToast('다시 시도합니다! 💪', 'info')
    } catch {
      showToast('재시도에 실패했어요', 'error')
    } finally {
      setSubmitting(null)
    }
  }

  const handleDelete = async (job: DownloadJob): Promise<void> => {
    if (job.status === 'running') return
    await window.api.removeDownload(job.id)
    showToast('목록에서 삭제했어요', 'info')
  }

  const handleStartQueue = async (): Promise<void> => {
    await window.api.downloadsStart()
    showToast('다운로드를 시작합니다! 🎬', 'success')
  }

  const handlePauseQueue = async (): Promise<void> => {
    await window.api.downloadsPause()
    showToast('다운로드를 일시정지했어요 ⏸️', 'info')
  }

  useEffect(() => {
    void (async (): Promise<void> => {
      try {
        const list = await window.api.listDownloads()
        setJobs(sortJobs(list))
      } finally {
        setHydrating(false)
      }
    })()

    const off = window.api.onDownloadsEvent((ev: DownloadQueueEvent): void => {
      if (ev.type === 'job-added') {
        setJobs((prev) => sortJobs([...prev.filter((j) => j.id !== ev.job.id), ev.job]))
        return
      }

      if (ev.type === 'job-updated') {
        setJobs((prev) => {
          const updated = sortJobs(prev.map((j) => (j.id !== ev.job.id ? j : ev.job)))

          const oldJob = prev.find((j) => j.id === ev.job.id)
          if (oldJob?.status !== 'completed' && ev.job.status === 'completed') {
            showToast(`✨ "${inferTitle(ev.job)}" 다운로드 완료!`, 'success')
          }
          if (oldJob?.status !== 'failed' && ev.job.status === 'failed') {
            const errorInfo = getErrorMessage(ev.job.error)
            showToast(`❌ ${errorInfo.title}`, 'error')
          }

          return updated
        })
        return
      }

      if (ev.type === 'job-removed') {
        setJobs((prev) => prev.filter((j) => j.id !== ev.id))
        return
      }

      if (ev.type === 'queue-state') {
        setQueueRunning(ev.running)
        setQueuePaused(ev.paused)
        setCurrentJobId(ev.currentJobId)
      }
    })

    return (): void => {
      off?.()
    }
  }, [showToast])

  return (
    <Stack sx={{ height: '100%' }}>
      <NavigationBar onDirectory={() => window.api.openDownloadDir()} />

      <Box sx={{ display: 'flex', justifyContent: 'center', flex: 1, overflow: 'hidden' }}>
        <Stack
          spacing={3}
          sx={{ p: 3, flex: 1, overflow: 'hidden', width: '100%', maxWidth: 1400 }}
        >
          {/* URL 입력 */}
          <Paper
            elevation={3}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '2px solid',
              borderColor: 'primary.main',
              background: (theme) =>
                `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(
                  theme.palette.background.paper,
                  1
                )} 100%)`,
              transition: 'all 0.3s ease'
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <SearchIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.125rem' }}>
                  영상 URL 입력
                </Typography>
                <Chip
                  size="small"
                  label="1단계"
                  color="primary"
                  variant="filled"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>

              <TextField
                inputRef={refUrl}
                placeholder="https://www.youtube.com/watch?v=... 또는 플레이리스트 URL을 붙여넣으세요"
                variant="outlined"
                fullWidth
                disabled={submitting !== null}
                onKeyDown={(e): void => {
                  if (e.key === 'Enter') void handleDownloadInfo(refUrl.current?.value || '')
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: '1rem',
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
                    }
                  }
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <VideoLibraryIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          variant="contained"
                          onClick={() => void handleDownloadInfo(refUrl.current?.value || '')}
                          disabled={submitting !== null}
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            px: 4,
                            py: 1.25,
                            borderRadius: 2
                          }}
                        >
                          {submitting ? '처리중...' : '추가하기'}
                        </Button>
                      </InputAdornment>
                    )
                  }
                }}
              />

              {submitting ? (
                <Fade in>
                  <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {submitting.kind === 'playlist'
                        ? '플레이리스트를 분석하고 있어요... 잠시만 기다려주세요 ⏳'
                        : '영상 정보를 확인하고 있어요... 곧 완료됩니다 🔍'}
                    </Typography>
                  </Alert>
                </Fade>
              ) : null}
            </Stack>
          </Paper>

          {/* 관리 패널 */}
          <Paper
            elevation={2}
            sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
          >
            <Stack spacing={2.5}>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
              >
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <DownloadingIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.125rem' }}>
                      다운로드 관리
                    </Typography>
                  </Stack>

                  <Chip
                    size="medium"
                    icon={
                      queueRunning && !queuePaused ? (
                        <DownloadIcon sx={{ fontSize: 18 }} />
                      ) : undefined
                    }
                    label={queueLabel}
                    color={queueRunning && !queuePaused ? 'primary' : 'default'}
                    variant={queueRunning && !queuePaused ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 600, px: 2 }}
                  />

                  {hydrating ? (
                    <Chip
                      size="medium"
                      variant="outlined"
                      label="불러오는 중..."
                      sx={{ fontWeight: 600 }}
                    />
                  ) : null}
                </Stack>

                <Stack direction="row" spacing={1.5}>
                  <Tooltip title="다운로드 폴더 열기">
                    <Button
                      variant="outlined"
                      startIcon={<FolderOpenIcon />}
                      onClick={() => window.api.openDownloadDir()}
                      sx={{ fontWeight: 600, borderRadius: 2, px: 2.5 }}
                    >
                      폴더 열기
                    </Button>
                  </Tooltip>

                  <Tooltip title="설정 보기/숨기기">
                    <IconButton
                      size="medium"
                      onClick={() => setShowAdvanced((v) => !v)}
                      sx={{
                        bgcolor: showAdvanced ? 'action.selected' : 'action.hover',
                        '&:hover': { bgcolor: 'action.selected' }
                      }}
                    >
                      <HelpOutlineIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>

              {jobs.length > 0 ? (
                <Stack direction="row" spacing={1.5} flexWrap="wrap">
                  <Chip
                    size="medium"
                    label={`전체 ${jobs.length}개`}
                    variant="filled"
                    sx={{ fontWeight: 600, px: 2 }}
                  />
                  {queuedCount > 0 ? (
                    <Chip
                      size="medium"
                      icon={<DownloadIcon sx={{ fontSize: 16 }} />}
                      label={`대기 ${queuedCount}개`}
                      variant="outlined"
                      sx={{ fontWeight: 600, px: 2 }}
                    />
                  ) : null}
                  {runningCount > 0 ? (
                    <Chip
                      size="medium"
                      icon={<DownloadingIcon sx={{ fontSize: 16 }} />}
                      label={`진행중 ${runningCount}개`}
                      variant="filled"
                      color="info"
                      sx={{ fontWeight: 600, px: 2 }}
                    />
                  ) : null}
                  {completedCount > 0 ? (
                    <Chip
                      size="medium"
                      icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                      label={`완료 ${completedCount}개`}
                      variant="filled"
                      color="success"
                      sx={{ fontWeight: 600, px: 2 }}
                    />
                  ) : null}
                  {failedCount > 0 ? (
                    <Chip
                      size="medium"
                      icon={<ErrorIcon sx={{ fontSize: 16 }} />}
                      label={`실패 ${failedCount}개`}
                      variant="filled"
                      color="error"
                      sx={{ fontWeight: 600, px: 2 }}
                    />
                  ) : null}
                </Stack>
              ) : null}

              <Divider />

              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Chip
                    size="small"
                    label="2단계"
                    color="primary"
                    variant="filled"
                    sx={{ fontWeight: 700 }}
                  />
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    다운로드 시작 또는 일시정지
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={2}>
                  <Tooltip
                    title={
                      !hasQueued
                        ? '먼저 위에서 영상 URL을 추가해주세요'
                        : queuePaused
                          ? '일시정지된 다운로드를 계속합니다'
                          : '대기중인 다운로드를 시작합니다'
                    }
                  >
                    <span style={{ flex: 1 }}>
                      <Button
                        size="large"
                        variant="contained"
                        fullWidth
                        startIcon={<PlayArrowIcon sx={{ fontSize: 24 }} />}
                        disabled={!canStart}
                        onClick={() => void handleStartQueue()}
                        sx={{
                          py: 1.75,
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          borderRadius: 2,
                          boxShadow: 3,
                          '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' },
                          '&:disabled': { bgcolor: 'action.disabledBackground' },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {queuePaused && hasQueued ? '계속하기' : '다운로드 시작'}
                      </Button>
                    </span>
                  </Tooltip>

                  <Tooltip title="진행중인 다운로드를 일시정지합니다">
                    <span style={{ flex: 1 }}>
                      <Button
                        size="large"
                        variant="outlined"
                        fullWidth
                        startIcon={<PauseIcon sx={{ fontSize: 24 }} />}
                        disabled={!canPause}
                        onClick={() => void handlePauseQueue()}
                        sx={{
                          py: 1.75,
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          borderRadius: 2,
                          borderWidth: 2,
                          '&:hover': { borderWidth: 2, transform: 'translateY(-2px)' },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        일시정지
                      </Button>
                    </span>
                  </Tooltip>
                </Stack>
              </Stack>

              <Collapse in={showAdvanced}>
                <Stack spacing={2} sx={{ pt: 1 }}>
                  <Divider />

                  <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={600}>
                      💡 새로 추가할 영상의 기본 설정을 지정할 수 있어요. 이미 추가된 항목은
                      개별적으로 변경 가능합니다.
                    </Typography>
                  </Alert>

                  <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
                    <Stack spacing={1.25}>
                      <Typography variant="body2" fontWeight={700} color="text.secondary">
                        기본 다운로드 형식
                      </Typography>
                      <ToggleButtonGroup
                        size="medium"
                        exclusive
                        value={defaultType}
                        onChange={(_, v): void => {
                          if (!v) return
                          setDefaultType(v)
                        }}
                        sx={{
                          '& .MuiToggleButton-root': {
                            px: 3,
                            py: 1.25,
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            borderRadius: 2
                          }
                        }}
                      >
                        <ToggleButton value="video">
                          <Stack direction="row" spacing={1} alignItems="center">
                            <VideoLibraryIcon sx={{ fontSize: 20 }} />
                            <span>비디오 (영상+음성)</span>
                          </Stack>
                        </ToggleButton>
                        <ToggleButton value="audio">
                          <Stack direction="row" spacing={1} alignItems="center">
                            <AudiotrackIcon sx={{ fontSize: 20 }} />
                            <span>오디오만</span>
                          </Stack>
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Stack>

                    <Divider orientation="vertical" flexItem />

                    <Stack spacing={1.25}>
                      <Typography variant="body2" fontWeight={700} color="text.secondary">
                        플레이리스트 다운로드 개수
                      </Typography>
                      <ToggleButtonGroup
                        size="medium"
                        exclusive
                        value={String(playlistLimit)}
                        onChange={(_, v): void => {
                          if (!v) return
                          const n = Number(v)
                          if (!Number.isFinite(n)) return
                          setPlaylistLimit(n)
                        }}
                        sx={{
                          '& .MuiToggleButton-root': {
                            px: 3,
                            py: 1.25,
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            borderRadius: 2
                          }
                        }}
                      >
                        <ToggleButton value="10">10개</ToggleButton>
                        <ToggleButton value="20">20개</ToggleButton>
                        <ToggleButton value="40">40개</ToggleButton>
                      </ToggleButtonGroup>
                    </Stack>
                  </Stack>
                </Stack>
              </Collapse>
            </Stack>
          </Paper>

          {/* 목록 */}
          <Box sx={{ flex: 1, overflow: 'auto', pr: 0.5 }}>
            <Stack spacing={2}>
              {hydrating ? (
                <Stack spacing={2}>
                  <DownloadsJobRowSkeleton />
                  <DownloadsJobRowSkeleton />
                  <DownloadsJobRowSkeleton />
                </Stack>
              ) : jobs.length === 0 && !submitting ? (
                <Fade in>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 6,
                      textAlign: 'center',
                      borderRadius: 3,
                      border: '2px dashed',
                      borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
                      background: (theme) =>
                        `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(
                          theme.palette.info.main,
                          0.03
                        )} 100%)`
                    }}
                  >
                    <Stack spacing={3} alignItems="center">
                      <Box
                        sx={{
                          width: 120,
                          height: 120,
                          borderRadius: '50%',
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <DownloadIcon sx={{ fontSize: 64, color: 'primary.main', opacity: 0.9 }} />
                      </Box>

                      <Stack spacing={1.5} alignItems="center">
                        <Typography variant="h5" fontWeight={700}>
                          다운로드할 영상을 추가해보세요! 🎬
                        </Typography>
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          sx={{ maxWidth: 600, lineHeight: 1.8 }}
                        >
                          위 입력창에 유튜브 영상 URL을 붙여넣으면 자동으로 목록에 추가됩니다.
                          <br />
                          여러 개를 추가한 후 <strong>다운로드 시작</strong> 버튼을 눌러 한번에
                          다운로드하세요!
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                </Fade>
              ) : (
                <>
                  {jobs.map((job) => (
                    <DownloadsJobRow
                      key={job.id}
                      job={job}
                      isCurrent={job.id === currentJobId}
                      onToggleType={handleToggleType}
                      onStop={handleStop}
                      onRetry={handleRetry}
                      onDelete={handleDelete}
                    />
                  ))}

                  {submitting ? (
                    <Stack spacing={2} sx={{ pt: 0.5 }}>
                      <DownloadsJobRowSkeleton />
                      {submitting.kind === 'playlist' ? <DownloadsJobRowSkeleton /> : null}
                    </Stack>
                  ) : null}
                </>
              )}
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Stack>
  )
}
