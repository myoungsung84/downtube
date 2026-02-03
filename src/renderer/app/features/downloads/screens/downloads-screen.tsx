import DownloadIcon from '@mui/icons-material/Download'
import { alpha, Box, Fade, Paper, Stack, Typography } from '@mui/material'
import { useToast } from '@renderer/shared/hooks/use-toast'
import type { DownloadJob, DownloadQueueEvent } from '@src/types/download.types'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import DownloadsJobRow from '../components/downloads-job-row'
import DownloadsJobRowSkeleton from '../components/downloads-job-row-skeleton'
import DownloadsQueuePanel from '../components/downloads-queue-panel'
import DownloadsUrlPanel from '../components/downloads-url-panel'
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
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Stack sx={{ p: 3, width: '100%', maxWidth: 1400 }} spacing={3}>
        <DownloadsUrlPanel
          inputRef={refUrl}
          submitting={submitting}
          onSubmit={() => void handleDownloadInfo(refUrl.current?.value || '')}
        />

        <DownloadsQueuePanel
          jobsTotal={jobs.length}
          queuedCount={queuedCount}
          runningCount={runningCount}
          completedCount={completedCount}
          failedCount={failedCount}
          queueLabel={queueLabel}
          queueRunning={queueRunning}
          queuePaused={queuePaused}
          hasQueued={hasQueued}
          canStart={canStart}
          canPause={canPause}
          hydrating={hydrating}
          showAdvanced={showAdvanced}
          onToggleAdvanced={() => setShowAdvanced((v) => !v)}
          defaultType={defaultType}
          onChangeDefaultType={(next) => setDefaultType(next)}
          playlistLimit={playlistLimit}
          onChangePlaylistLimit={(next) => setPlaylistLimit(next)}
          onOpenDir={() => window.api.openDownloadDir()}
          onStartQueue={() => void handleStartQueue()}
          onPauseQueue={() => void handlePauseQueue()}
        />

        {/* 목록 (페이지 스크롤로 흘려보냄) */}
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
      </Stack>
    </Box>
  )
}
