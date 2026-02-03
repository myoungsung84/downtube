import AudiotrackIcon from '@mui/icons-material/Audiotrack'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import DownloadingIcon from '@mui/icons-material/Downloading'
import ErrorIcon from '@mui/icons-material/Error'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ReplayIcon from '@mui/icons-material/Replay'
import SearchIcon from '@mui/icons-material/Search'
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
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material'
import NavigationBar from '@renderer/shared/components/ui/navigation-bar'
import type { DownloadJob, DownloadQueueEvent } from '@src/types/download.types'
import { useEffect, useMemo, useRef, useState } from 'react'

function isPlaylistUrl(input: string): boolean {
  try {
    const u = new URL(input)
    return Boolean(u.searchParams.get('list'))
  } catch {
    return /[?&]list=/.test(input)
  }
}

function statusLabel(status: DownloadJob['status']): string {
  switch (status) {
    case 'queued':
      return '대기중'
    case 'running':
      return '다운로드중'
    case 'completed':
      return '완료'
    case 'failed':
      return '실패'
    case 'cancelled':
      return '취소됨'
    default:
      return status
  }
}

function formatPercent(p: number | undefined): string {
  if (p == null || Number.isNaN(p)) return '0%'
  const v = Math.max(0, Math.min(100, p))
  return `${v.toFixed(1)}%`
}

function inferTitle(job: DownloadJob): string {
  return job.filename || job.url
}

function sortJobs(jobs: DownloadJob[]): DownloadJob[] {
  return [...jobs].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
}

function statusTone(status: DownloadJob['status']): {
  borderColor?: string
  bg?: string
  chipColor?: 'default' | 'success' | 'error' | 'warning' | 'info'
} {
  switch (status) {
    case 'running':
      return { borderColor: 'primary.main', bg: 'action.hover', chipColor: 'info' }
    case 'completed':
      return { borderColor: 'success.main', bg: 'rgba(46, 125, 50, 0.08)', chipColor: 'success' }
    case 'failed':
      return { borderColor: 'error.main', bg: 'rgba(211, 47, 47, 0.08)', chipColor: 'error' }
    case 'cancelled':
      return { borderColor: 'warning.main', bg: 'rgba(237, 108, 2, 0.08)', chipColor: 'warning' }
    case 'queued':
    default:
      return { borderColor: 'divider', bg: 'transparent', chipColor: 'default' }
  }
}

function getErrorMessage(error: string | undefined): {
  title: string
  description: string
} {
  if (!error) return { title: '알 수 없는 오류', description: '다시 시도해주세요.' }

  const lowerError = error.toLowerCase()

  if (lowerError.includes('network') || lowerError.includes('connection')) {
    return {
      title: '인터넷 연결 문제',
      description: '인터넷 연결을 확인하고 다시 시도해주세요.'
    }
  }

  if (lowerError.includes('not found') || lowerError.includes('404')) {
    return {
      title: '영상을 찾을 수 없음',
      description: '삭제되었거나 비공개 영상일 수 있어요.'
    }
  }

  if (lowerError.includes('private') || lowerError.includes('unavailable')) {
    return {
      title: '접근할 수 없는 영상',
      description: '비공개 또는 지역 제한 영상이에요.'
    }
  }

  return {
    title: '다운로드 실패',
    description: error.length > 100 ? error.slice(0, 100) + '...' : error
  }
}

const chipSx = {
  justifyContent: 'center',
  alignItems: 'center',
  py: 2,
  px: 1
} as const

const actionBtnSx = {
  width: 36,
  height: 36
} as const

type ToastMessage = {
  message: string
  severity: 'success' | 'error' | 'info' | 'warning'
}

export default function DownloadsScreen(): React.JSX.Element {
  const refUrl = useRef<HTMLInputElement>(null)
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

  const [toast, setToast] = useState<ToastMessage | null>(null)

  useMemo(() => {
    const m = new Map<string, DownloadJob>()
    for (const j of jobs) m.set(j.id, j)
    return m
  }, [jobs])

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

  const showToast = (message: string, severity: ToastMessage['severity'] = 'info'): void => {
    setToast({ message, severity })
  }

  const handleDownloadInfo = async (inputUrl: string): Promise<void> => {
    const url = inputUrl.trim()
    if (!url) return

    const kind: 'playlist' | 'single' = isPlaylistUrl(url) ? 'playlist' : 'single'
    setSubmitting({ url, kind })

    try {
      if (kind === 'playlist') {
        await window.api.downloadPlaylist({
          url,
          type: defaultType,
          playlistLimit: Math.max(1, Math.min(500, playlistLimit))
        })
        showToast(`플레이리스트를 목록에 추가했어요. "시작" 버튼을 눌러 다운로드하세요!`, 'success')
        return
      }

      if (defaultType === 'audio') {
        await window.api.downloadAudio(url)
      } else {
        await window.api.download(url)
      }

      showToast('다운로드 목록에 추가했어요. "시작" 버튼을 눌러 다운로드하세요!', 'success')
    } catch {
      showToast('URL을 추가하는데 실패했어요. 주소를 확인해주세요.', 'error')
    } finally {
      setSubmitting(null)
      if (refUrl.current) {
        refUrl.current.value = ''
      }
    }
  }

  const handleToggleType = async (jobId: string, type: 'video' | 'audio'): Promise<void> => {
    await window.api.setDownloadType({ id: jobId, type })
  }

  const handleStop = async (job: DownloadJob): Promise<void> => {
    await window.api.stopDownload(job.url)
    showToast('다운로드를 중단했어요.', 'info')
  }

  const handleRetry = async (job: DownloadJob): Promise<void> => {
    if (job.status === 'cancelled') {
      await window.api.removeDownload(job.id)
    }

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

      showToast('다시 시도합니다!', 'info')
    } catch {
      showToast('재시도에 실패했어요.', 'error')
    } finally {
      setSubmitting(null)
    }
  }

  const handleDelete = async (job: DownloadJob): Promise<void> => {
    if (job.status === 'running') return
    await window.api.removeDownload(job.id)
    showToast('목록에서 삭제했어요.', 'info')
  }

  const handleStartQueue = async (): Promise<void> => {
    await window.api.downloadsStart()
    showToast('다운로드를 시작합니다!', 'success')
  }

  const handlePauseQueue = async (): Promise<void> => {
    await window.api.downloadsPause()
    showToast('다운로드를 일시정지했어요.', 'info')
  }

  useEffect(() => {
    void (async () => {
      try {
        const list = await window.api.listDownloads()
        setJobs(sortJobs(list))
      } finally {
        setHydrating(false)
      }
    })()

    const off = window.api.onDownloadsEvent((ev: DownloadQueueEvent) => {
      if (ev.type === 'job-added') {
        console.log('job-added', ev.job)
        setJobs((prev) => sortJobs([...prev.filter((j) => j.id !== ev.job.id), ev.job]))
        return
      }

      if (ev.type === 'job-updated') {
        setJobs((prev) => {
          const updated = sortJobs(prev.map((j) => (j.id !== ev.job.id ? j : ev.job)))

          const oldJob = prev.find((j) => j.id === ev.job.id)
          if (oldJob?.status !== 'completed' && ev.job.status === 'completed') {
            showToast(`"${inferTitle(ev.job)}" 다운로드 완료!`, 'success')
          }

          if (oldJob?.status !== 'failed' && ev.job.status === 'failed') {
            const errorInfo = getErrorMessage(ev.job.error)
            showToast(`다운로드 실패: ${errorInfo.title}`, 'error')
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

    return () => {
      off?.()
    }
  }, [])

  return (
    <Stack sx={{ height: '100%' }}>
      <NavigationBar onDirectory={() => window.api.openDownloadDir()} />
      <Box sx={{ display: 'flex', justifyContent: 'center', flex: 1, overflow: 'hidden' }}>
        <Stack
          spacing={2.5}
          sx={{
            p: 3,
            flex: 1,
            overflow: 'hidden',
            width: '100%'
          }}
        >
          <TextField
            inputRef={refUrl}
            placeholder="YouTube URL을 입력하세요"
            variant="outlined"
            fullWidth
            size="medium"
            onKeyDown={(e): void => {
              if (e.key === 'Enter') {
                handleDownloadInfo(refUrl.current?.value || '')
              }
            }}
            sx={{
              '& .MuiInputBase-input': {
                fontSize: '0.9rem'
              }
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      color="primary"
                      onClick={() => handleDownloadInfo(refUrl.current?.value || '')}
                      edge="end"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        px: 3,
                        py: 1,
                        margin: 0,
                        borderRadius: 1.5,
                        color: 'text.primary'
                      }}
                    >
                      검색
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              background: (theme) =>
                `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <DownloadingIcon sx={{ fontSize: 24, color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.125rem' }}>
                      다운로드 관리
                    </Typography>
                  </Stack>

                  <Chip
                    size="small"
                    icon={
                      queueRunning && !queuePaused ? (
                        <DownloadIcon sx={{ fontSize: 16 }} />
                      ) : undefined
                    }
                    sx={chipSx}
                    label={queueLabel}
                    color={queueRunning && !queuePaused ? 'primary' : 'default'}
                    variant={queueRunning && !queuePaused ? 'filled' : 'outlined'}
                  />

                  {hydrating ? (
                    <Chip size="small" sx={chipSx} variant="outlined" label="불러오는 중..." />
                  ) : null}

                  {submitting ? (
                    <Chip
                      size="small"
                      sx={chipSx}
                      color="info"
                      variant="outlined"
                      label={
                        submitting.kind === 'playlist' ? '플레이리스트 분석중...' : '주소 확인중...'
                      }
                    />
                  ) : null}
                </Stack>

                <Stack direction="row" spacing={1}>
                  <Tooltip title="다운로드 폴더 열기">
                    <IconButton
                      size="small"
                      onClick={() => window.api.openDownloadDir()}
                      sx={{
                        bgcolor: 'action.hover',
                        '&:hover': { bgcolor: 'action.selected' }
                      }}
                    >
                      <FolderOpenIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="다운로드된 파일은 설정한 폴더에 저장됩니다">
                    <IconButton
                      size="small"
                      sx={{
                        bgcolor: 'action.hover',
                        '&:hover': { bgcolor: 'action.selected' }
                      }}
                    >
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>

              {jobs.length > 0 ? (
                <Stack direction="row" spacing={1.25} flexWrap="wrap">
                  <Chip
                    size="small"
                    label={`전체 ${jobs.length}개`}
                    variant="outlined"
                    sx={chipSx}
                  />

                  {queuedCount > 0 ? (
                    <Chip
                      size="small"
                      icon={<DownloadIcon sx={{ fontSize: 14 }} />}
                      label={`대기 ${queuedCount}개`}
                      variant="outlined"
                      color="default"
                      sx={chipSx}
                    />
                  ) : null}

                  {runningCount > 0 ? (
                    <Chip
                      size="small"
                      icon={<DownloadingIcon sx={{ fontSize: 14 }} />}
                      label={`진행중 ${runningCount}개`}
                      variant="filled"
                      color="info"
                      sx={chipSx}
                    />
                  ) : null}

                  {completedCount > 0 ? (
                    <Chip
                      size="small"
                      icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                      label={`완료 ${completedCount}개`}
                      variant="outlined"
                      color="success"
                      sx={chipSx}
                    />
                  ) : null}

                  {failedCount > 0 ? (
                    <Chip
                      size="small"
                      icon={<ErrorIcon sx={{ fontSize: 14 }} />}
                      label={`실패 ${failedCount}개`}
                      variant="outlined"
                      color="error"
                      sx={chipSx}
                    />
                  ) : null}
                </Stack>
              ) : null}

              <Divider />

              <Stack direction="row" spacing={2.5} alignItems="center" flexWrap="wrap">
                <Stack direction="row" spacing={1.25}>
                  <Tooltip
                    title={
                      !hasQueued
                        ? '먼저 위에서 영상 URL을 추가해주세요'
                        : queuePaused
                          ? '일시정지된 다운로드를 계속합니다'
                          : '대기중인 다운로드를 시작합니다'
                    }
                  >
                    <span>
                      <Button
                        size="medium"
                        variant="contained"
                        startIcon={<PlayArrowIcon fontSize="small" />}
                        disabled={!canStart}
                        onClick={() => void handleStartQueue()}
                        sx={{
                          px: 2.5,
                          py: 0.75,
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          borderRadius: 1.5,
                          boxShadow: 2
                        }}
                      >
                        {queuePaused && hasQueued ? '계속하기' : '다운로드 시작'}
                      </Button>
                    </span>
                  </Tooltip>

                  <Tooltip title="진행중인 다운로드를 일시정지합니다">
                    <span>
                      <Button
                        size="medium"
                        variant="outlined"
                        startIcon={<PauseIcon fontSize="small" />}
                        disabled={!canPause}
                        onClick={() => void handlePauseQueue()}
                        sx={{
                          px: 2.5,
                          py: 0.75,
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          borderRadius: 1.5
                        }}
                      >
                        일시정지
                      </Button>
                    </span>
                  </Tooltip>
                </Stack>

                <Divider orientation="vertical" flexItem />

                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{ opacity: 0.8, fontSize: '0.8125rem' }}
                  >
                    기본 형식:
                  </Typography>

                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={defaultType}
                    onChange={(_, v) => {
                      if (!v) return
                      setDefaultType(v)
                    }}
                    sx={{
                      '& .MuiToggleButton-root': {
                        px: 1.5,
                        py: 0.5,
                        fontWeight: 600,
                        fontSize: '0.8125rem'
                      }
                    }}
                  >
                    <ToggleButton value="video">
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <VideoLibraryIcon sx={{ fontSize: 16 }} />
                        <span>비디오</span>
                      </Stack>
                    </ToggleButton>
                    <ToggleButton value="audio">
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <AudiotrackIcon sx={{ fontSize: 16 }} />
                        <span>오디오</span>
                      </Stack>
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Stack>

                <Divider orientation="vertical" flexItem />

                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{ opacity: 0.8, fontSize: '0.8125rem' }}
                  >
                    플레이리스트:
                  </Typography>

                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={String(playlistLimit)}
                    onChange={(_, v) => {
                      if (!v) return
                      const n = Number(v)
                      if (!Number.isFinite(n)) return
                      setPlaylistLimit(n)
                    }}
                    sx={{
                      '& .MuiToggleButton-root': {
                        px: 1.5,
                        py: 0.5,
                        fontWeight: 600,
                        fontSize: '0.8125rem'
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
          </Paper>

          <Box sx={{ flex: 1, overflow: 'auto', pr: 0.5 }}>
            <Stack spacing={1.75}>
              {hydrating ? (
                <Stack spacing={1.75}>
                  <JobRowSkeleton />
                  <JobRowSkeleton />
                  <JobRowSkeleton />
                </Stack>
              ) : jobs.length === 0 && !submitting ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 5,
                    textAlign: 'center',
                    borderRadius: 3,
                    border: '2px dashed',
                    borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
                    background: (theme) =>
                      `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`
                  }}
                >
                  <Stack spacing={2.5} alignItems="center">
                    <Box
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <DownloadIcon sx={{ fontSize: 56, color: 'primary.main', opacity: 0.8 }} />
                    </Box>

                    <Stack spacing={1} alignItems="center">
                      <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.125rem' }}>
                        다운로드할 영상을 추가해보세요
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ maxWidth: 500, lineHeight: 1.6, fontSize: '0.875rem' }}
                      >
                        위 입력창에 유튜브 영상 URL을 붙여넣으면 자동으로 목록에 추가됩니다.
                        <br />
                        여러 개를 추가한 후 <strong>{`"다운로드 시작"`}</strong> 버튼을 눌러 한번에
                        다운로드하세요!
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              ) : (
                <>
                  {jobs.map((job) => (
                    <JobRow
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
                    <Stack spacing={1.75} sx={{ pt: 0.5 }}>
                      <JobRowSkeleton />
                      {submitting.kind === 'playlist' ? <JobRowSkeleton /> : null}
                    </Stack>
                  ) : null}
                </>
              )}
            </Stack>
          </Box>
        </Stack>
      </Box>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {toast ? (
          <Alert
            severity={toast.severity}
            onClose={() => setToast(null)}
            variant="filled"
            sx={{ fontWeight: 600, boxShadow: 3, fontSize: '0.875rem' }}
          >
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Stack>
  )
}

function JobRow(props: {
  job: DownloadJob
  isCurrent: boolean
  onToggleType: (id: string, type: 'video' | 'audio') => void
  onStop: (job: DownloadJob) => void
  onRetry: (job: DownloadJob) => void
  onDelete: (job: DownloadJob) => void
}): React.JSX.Element {
  const { job } = props
  const tone = statusTone(job.status)

  const canToggle = job.status === 'queued'
  const canStop = job.status === 'queued' || job.status === 'running'
  const canRetry = job.status === 'failed' || job.status === 'cancelled'
  const canDelete = job.status !== 'running'

  const percent = Math.max(0, Math.min(100, job.progress?.percent ?? 0))
  const showProgressBar = job.status === 'running'

  const errorInfo = job.error ? getErrorMessage(job.error) : null

  return (
    <Paper
      elevation={props.isCurrent ? 4 : 0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: props.isCurrent ? 'primary.main' : tone.borderColor,
        borderWidth: props.isCurrent ? 2 : 1,
        backgroundColor: tone.bg,
        transition: 'all 0.25s ease-in-out'
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
          <Stack spacing={1} sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
              {job.status === 'running' ? (
                <DownloadingIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              ) : job.status === 'completed' ? (
                <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
              ) : job.status === 'failed' ? (
                <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />
              ) : job.status === 'cancelled' ? (
                <WarningIcon sx={{ color: 'warning.main', fontSize: 20 }} />
              ) : (
                <DownloadIcon sx={{ color: 'action.active', fontSize: 20 }} />
              )}

              <Typography
                noWrap
                fontWeight={700}
                sx={{ minWidth: 0, fontSize: '0.9375rem' }}
                title={inferTitle(job)}
              >
                {inferTitle(job)}
              </Typography>

              <Chip
                size="small"
                sx={chipSx}
                label={statusLabel(job.status)}
                color={tone.chipColor ?? 'default'}
                variant="filled"
              />
            </Stack>

            <Typography
              noWrap
              variant="body2"
              sx={{ opacity: 0.65, fontSize: '0.8125rem', pl: 3.5 }}
              title={job.url}
            >
              {job.url}
            </Typography>

            {job.status === 'running' && job.progress?.current ? (
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ pl: 3.5 }}>
                <Typography
                  variant="body2"
                  color="primary"
                  fontWeight={700}
                  sx={{ fontSize: '0.8125rem' }}
                >
                  {job.progress.current}
                </Typography>
                <Chip
                  size="small"
                  label={formatPercent(job.progress.percent)}
                  color="primary"
                  variant="outlined"
                  sx={{ ...chipSx, height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.75rem' } }}
                />
              </Stack>
            ) : null}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip
              title={
                canToggle
                  ? '비디오 또는 오디오만 다운로드할지 선택하세요'
                  : '대기중인 항목만 변경할 수 있어요'
              }
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
                      px: 1.25,
                      py: 0.375,
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }
                  }}
                >
                  <ToggleButton value="video">
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <VideoLibraryIcon sx={{ fontSize: 14 }} />
                      <span>비디오</span>
                    </Stack>
                  </ToggleButton>
                  <ToggleButton value="audio">
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <AudiotrackIcon sx={{ fontSize: 14 }} />
                      <span>오디오</span>
                    </Stack>
                  </ToggleButton>
                </ToggleButtonGroup>
              </span>
            </Tooltip>

            <Tooltip title={canRetry ? '다시 다운로드 시도' : '실패하거나 취소된 항목만 가능해요'}>
              <span>
                <IconButton
                  sx={actionBtnSx}
                  disabled={!canRetry}
                  onClick={() => void props.onRetry(job)}
                >
                  <ReplayIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={canStop ? '다운로드 중단' : '진행중이거나 대기중인 항목만 가능해요'}>
              <span>
                <IconButton
                  sx={actionBtnSx}
                  disabled={!canStop}
                  onClick={() => void props.onStop(job)}
                >
                  <StopIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={canDelete ? '목록에서 삭제' : '다운로드 중에는 삭제할 수 없어요'}>
              <span>
                <IconButton
                  sx={actionBtnSx}
                  disabled={!canDelete}
                  onClick={() => void props.onDelete(job)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        {showProgressBar ? (
          <Box sx={{ px: 3.5 }}>
            <LinearProgress
              variant="determinate"
              value={percent}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
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
            sx={{
              py: 0.75,
              borderRadius: 1.5,
              '& .MuiAlert-icon': { fontSize: 20 }
            }}
          >
            <AlertTitle sx={{ mb: 0.25, fontSize: '0.8125rem', fontWeight: 700 }}>
              {errorInfo.title}
            </AlertTitle>
            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
              {errorInfo.description}
            </Typography>
          </Alert>
        ) : null}

        {job.status === 'completed' ? (
          <Alert
            severity="success"
            variant="outlined"
            icon={<CheckCircleIcon fontSize="small" />}
            sx={{
              py: 0.75,
              borderRadius: 1.5,
              bgcolor: (theme) => alpha(theme.palette.success.main, 0.05),
              '& .MuiAlert-icon': { fontSize: 20 }
            }}
          >
            <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
              다운로드가 완료되었어요! 저장 폴더에서 확인하세요.
            </Typography>
          </Alert>
        ) : null}
      </Stack>
    </Paper>
  )
}

function JobRowSkeleton(): React.JSX.Element {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack spacing={1} sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Skeleton variant="circular" width={20} height={20} />
              <Skeleton variant="text" width={280} height={24} />
              <Skeleton variant="rounded" width={60} height={24} />
            </Stack>
            <Skeleton variant="text" width="65%" height={18} sx={{ ml: 3.5 }} />
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Skeleton variant="rounded" width={140} height={32} />
            <Skeleton variant="circular" width={36} height={36} />
            <Skeleton variant="circular" width={36} height={36} />
            <Skeleton variant="circular" width={36} height={36} />
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  )
}
