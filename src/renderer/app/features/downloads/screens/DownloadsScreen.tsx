import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ReplayIcon from '@mui/icons-material/Replay'
import StopIcon from '@mui/icons-material/Stop'
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material'
import NavigationBar from '@renderer/shared/components/ui/NavigationBar'
import type { DownloadJob, DownloadQueueEvent } from '@src/types/download.types'
import { useEffect, useMemo, useState } from 'react'

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
      return 'queued'
    case 'running':
      return 'running'
    case 'completed':
      return 'completed'
    case 'failed':
      return 'failed'
    case 'cancelled':
      return 'cancelled'
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
  return [...jobs].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
}

export default function DownloadsScreen(): React.JSX.Element {
  const [jobs, setJobs] = useState<DownloadJob[]>([])
  const [queueRunning, setQueueRunning] = useState(false)
  const [queuePaused, setQueuePaused] = useState(true)
  const [currentJobId, setCurrentJobId] = useState<string | undefined>(undefined)

  const [defaultType, setDefaultType] = useState<'video' | 'audio'>('video')
  const [playlistLimit, setPlaylistLimit] = useState(3)

  const jobsById = useMemo(() => {
    const m = new Map<string, DownloadJob>()
    for (const j of jobs) m.set(j.id, j)
    return m
  }, [jobs])

  const queuedCount = useMemo(() => jobs.filter((j) => j.status === 'queued').length, [jobs])
  const hasQueued = queuedCount > 0

  const queueLabel = useMemo(() => {
    if (queueRunning && queuePaused) return 'Queue: running (pause pending)'
    if (queueRunning) return 'Queue: running'
    if (queuePaused) return 'Queue: paused'
    return 'Queue: idle'
  }, [queueRunning, queuePaused])

  // Start는 queued가 있어야 의미 있음
  const canStart = hasQueued && !queueRunning
  // Pause는 paused가 아닐 때만 의미 있음 (running이든 아니든 “다음부터 멈춤”)
  const canPause = !queuePaused

  const handleDownloadInfo = async (inputUrl: string): Promise<void> => {
    const url = inputUrl.trim()
    if (!url) return

    if (isPlaylistUrl(url)) {
      await window.api.downloadPlaylist({
        url,
        type: defaultType,
        playlistLimit: Math.max(1, Math.min(500, playlistLimit))
      })
      return
    }

    if (defaultType === 'audio') {
      await window.api.downloadAudio(url)
      return
    }

    await window.api.download(url)
  }

  const handleToggleType = async (jobId: string, type: 'video' | 'audio'): Promise<void> => {
    await window.api.setDownloadType({ id: jobId, type })
  }

  const handleStop = async (job: DownloadJob): Promise<void> => {
    await window.api.stopDownload(job.url)
  }

  const handlePlay = async (job: DownloadJob): Promise<void> => {
    await window.api.playVideo(job.url)
  }

  const handleRetry = async (job: DownloadJob): Promise<void> => {
    // playlist retry는 별도 UX로 (지금은 단일 URL만)
    if (isPlaylistUrl(job.url)) {
      await window.api.downloadPlaylist({
        url: job.url,
        type: job.type,
        playlistLimit: Math.max(1, Math.min(500, playlistLimit))
      })
      return
    }

    if (job.type === 'audio') {
      await window.api.downloadAudio(job.url)
      return
    }

    await window.api.download(job.url)
  }

  const handleStartQueue = async (): Promise<void> => {
    await window.api.downloadsStart()
  }

  const handlePauseQueue = async (): Promise<void> => {
    await window.api.downloadsPause()
  }

  useEffect(() => {
    void (async () => {
      try {
        const list = await window.api.listDownloads()
        setJobs(sortJobs(list))
      } catch {
        // ignore
      }
    })()

    const off = window.api.onDownloadsEvent((ev: DownloadQueueEvent) => {
      if (ev.type === 'job-added') {
        setJobs((prev) => sortJobs([ev.job, ...prev.filter((j) => j.id !== ev.job.id)]))
        return
      }

      if (ev.type === 'job-updated') {
        setJobs((prev) => sortJobs(prev.map((j) => (j.id !== ev.job.id ? j : ev.job))))
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
      {/* ✅ 네가 말한대로 그대로 유지 */}
      <NavigationBar
        onSubmit={handleDownloadInfo}
        onDirectory={() => window.api.openDownloadDir()}
      />

      <Stack spacing={2} sx={{ p: 2, flex: 1, overflow: 'hidden' }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography fontWeight={800}>Downloads</Typography>

              <Chip size="small" label={queueLabel} variant="outlined" />

              {queuedCount > 0 ? (
                <Chip size="small" label={`Queued: ${queuedCount}`} variant="outlined" />
              ) : null}

              {currentJobId ? (
                <Chip
                  size="small"
                  label={`Current: ${jobsById.get(currentJobId)?.filename ?? currentJobId.slice(0, 8)}`}
                  variant="outlined"
                />
              ) : null}
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                size="small"
                variant="contained"
                startIcon={<PlayArrowIcon />}
                disabled={!canStart}
                onClick={() => void handleStartQueue()}
              >
                Start / Resume
              </Button>

              <Button
                size="small"
                variant="outlined"
                startIcon={<PauseIcon />}
                disabled={!canPause}
                onClick={() => void handlePauseQueue()}
              >
                Pause
              </Button>

              <Divider orientation="vertical" flexItem />

              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Default
                </Typography>

                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={defaultType}
                  onChange={(_, v) => {
                    if (!v) return
                    setDefaultType(v)
                  }}
                >
                  <ToggleButton value="video">Video</ToggleButton>
                  <ToggleButton value="audio">Audio</ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              <Divider orientation="vertical" flexItem />

              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Playlist limit
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
                >
                  <ToggleButton value="20">20</ToggleButton>
                  <ToggleButton value="50">50</ToggleButton>
                  <ToggleButton value="100">100</ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              <Tooltip title="Open download folder">
                <IconButton onClick={() => void window.api.openDownloadDir()}>
                  <FolderOpenIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>

        <Box sx={{ flex: 1, overflow: 'auto', pr: 0.5 }}>
          <Stack spacing={1.25}>
            {jobs.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography sx={{ opacity: 0.7 }}>
                  아직 작업이 없어. 위에 URL 넣으면 리스트에 쌓이고, Start를 눌러야 시작해.
                </Typography>
              </Paper>
            ) : (
              jobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  isCurrent={job.id === currentJobId}
                  onToggleType={handleToggleType}
                  onStop={handleStop}
                  onPlay={handlePlay}
                  onRetry={handleRetry}
                />
              ))
            )}
          </Stack>
        </Box>
      </Stack>
    </Stack>
  )
}

function JobRow(props: {
  job: DownloadJob
  isCurrent: boolean
  onToggleType: (id: string, type: 'video' | 'audio') => void
  onStop: (job: DownloadJob) => void
  onPlay: (job: DownloadJob) => void
  onRetry: (job: DownloadJob) => void
}): React.JSX.Element {
  const { job } = props

  const canToggle = job.status === 'queued'
  const canStop = job.status === 'queued' || job.status === 'running'
  const canPlay = job.status === 'running' || job.status === 'completed'
  const canRetry = job.status === 'failed' || job.status === 'cancelled'

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderColor: props.isCurrent ? 'primary.main' : 'divider',
        boxShadow: props.isCurrent ? 1 : 0
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
        <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <Typography noWrap fontWeight={800} sx={{ minWidth: 0 }}>
              {inferTitle(job)}
            </Typography>

            <Chip size="small" label={statusLabel(job.status)} variant="outlined" />

            {job.progress?.current ? (
              <Chip
                size="small"
                label={`${job.progress.current} · ${formatPercent(job.progress.percent)}`}
                variant="outlined"
              />
            ) : (
              <Chip size="small" label={formatPercent(job.progress?.percent)} variant="outlined" />
            )}
          </Stack>

          <Typography noWrap variant="body2" sx={{ opacity: 0.65 }}>
            {job.url}
          </Typography>

          {job.error ? (
            <Typography variant="body2" sx={{ color: 'error.main' }} noWrap>
              {job.error}
            </Typography>
          ) : null}
        </Stack>

        <Stack direction="row" spacing={1.25} alignItems="center">
          <ToggleButtonGroup
            size="small"
            exclusive
            value={job.type}
            disabled={!canToggle}
            onChange={(_, v) => {
              if (!v) return
              props.onToggleType(job.id, v)
            }}
          >
            <ToggleButton value="video">Video</ToggleButton>
            <ToggleButton value="audio">Audio</ToggleButton>
          </ToggleButtonGroup>

          <Tooltip title="Retry">
            <span>
              <IconButton disabled={!canRetry} onClick={() => void props.onRetry(job)}>
                <ReplayIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Play">
            <span>
              <IconButton disabled={!canPlay} onClick={() => void props.onPlay(job)}>
                <PlayArrowIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Stop">
            <span>
              <IconButton disabled={!canStop} onClick={() => void props.onStop(job)}>
                <StopIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  )
}
