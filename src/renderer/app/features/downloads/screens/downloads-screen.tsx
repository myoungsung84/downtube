import { Box, Stack } from '@mui/material'
import { useSettingsStore } from '@renderer/features/settings/store/use-settings-store'
import { useToast } from '@renderer/shared/hooks/use-toast'
import type { DownloadJob, DownloadQueueEvent } from '@src/types/download.types'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import DownloadsEmptyState from '../components/downloads-empty-state'
import DownloadsJobRow from '../components/downloads-job-row'
import DownloadsJobRowSkeleton from '../components/downloads-job-row-skeleton'
import DownloadsQueuePanel from '../components/downloads-queue-panel'
import DownloadsUrlPanel from '../components/downloads-url-panel'
import {
  getErrorMessage,
  inferTitle,
  isPlaylistUrl,
  isYoutubeUrl,
  sortJobs,
  updateRecentUrls
} from '../lib/downloads-utils'

const DOWNLOADS_DEFAULT_TYPE_KEY = 'downloads.defaultType' as const
const DOWNLOADS_PLAYLIST_LIMIT_KEY = 'downloads.playlistLimit' as const
const DOWNLOADS_RECENT_URLS_KEY = 'downloads.recentUrls' as const

export default function DownloadsScreen(): React.JSX.Element {
  const refUrl = useRef<HTMLInputElement>(null)

  const { showToast } = useToast()
  const hydrateSettings = useSettingsStore((state) => state.hydrateSettings)
  const setSettingValue = useSettingsStore((state) => state.setValue)

  const [jobs, setJobs] = useState<DownloadJob[]>([])
  const [hydrating, setHydrating] = useState(true)
  const [inputValue, setInputValue] = useState('')

  const [queueRunning, setQueueRunning] = useState(false)
  const [queuePaused, setQueuePaused] = useState(true)
  const [currentJobId, setCurrentJobId] = useState<string | undefined>(undefined)

  const [submitting, setSubmitting] = useState<null | { url: string; kind: 'playlist' | 'single' }>(
    null
  )
  const jobsRef = useRef<DownloadJob[]>([])
  const storedDefaultType = useSettingsStore((state) => state.values[DOWNLOADS_DEFAULT_TYPE_KEY])
  const storedPlaylistLimit = useSettingsStore(
    (state) => state.values[DOWNLOADS_PLAYLIST_LIMIT_KEY]
  )
  const storedRecentUrls = useSettingsStore((state) => state.values[DOWNLOADS_RECENT_URLS_KEY])
  const defaultType: 'video' | 'audio' = storedDefaultType === 'audio' ? 'audio' : 'video'
  const playlistLimit =
    typeof storedPlaylistLimit === 'number' &&
    Number.isFinite(storedPlaylistLimit) &&
    Number.isInteger(storedPlaylistLimit) &&
    storedPlaylistLimit >= 1
      ? storedPlaylistLimit
      : 10
  const recentUrls = Array.isArray(storedRecentUrls)
    ? storedRecentUrls.filter((item): item is string => typeof item === 'string')
    : []

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

  useEffect(() => {
    jobsRef.current = jobs
  }, [jobs])

  useEffect(() => {
    void hydrateSettings([
      DOWNLOADS_DEFAULT_TYPE_KEY,
      DOWNLOADS_PLAYLIST_LIMIT_KEY,
      DOWNLOADS_RECENT_URLS_KEY
    ])
  }, [hydrateSettings])

  const persistRecentUrl = (url: string): void => {
    const nextRecentUrls = updateRecentUrls(recentUrls, url)
    void setSettingValue(DOWNLOADS_RECENT_URLS_KEY, nextRecentUrls)
  }

  const handleSelectRecentUrl = (url: string): void => {
    setInputValue(url)
    if (!refUrl.current) return
    refUrl.current.value = url
    refUrl.current.focus()
    refUrl.current.setSelectionRange(url.length, url.length)
  }

  const handleRemoveRecentUrl = (url: string): void => {
    void setSettingValue(
      DOWNLOADS_RECENT_URLS_KEY,
      recentUrls.filter((item) => item !== url)
    )
  }

  const handleClearRecentUrls = (): void => {
    void setSettingValue(DOWNLOADS_RECENT_URLS_KEY, [])
  }

  const handleDownloadInfo = async (inputUrl: string): Promise<void> => {
    const url = inputUrl.trim()
    if (!url) {
      showToast('주소를 입력해주세요', 'warning')
      return
    }
    if (!isYoutubeUrl(url)) {
      showToast('올바른 영상 주소만 추가할 수 있어요', 'warning')
      return
    }

    const kind: 'playlist' | 'single' = isPlaylistUrl(url) ? 'playlist' : 'single'
    setSubmitting({ url, kind })
    persistRecentUrl(url)

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

      setInputValue('')
      if (refUrl.current) refUrl.current.value = ''
    } catch {
      showToast('주소를 추가하지 못했어요. 입력한 주소를 확인해주세요 😢', 'error')
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

    if (!isYoutubeUrl(job.url)) {
      showToast('정확한 주소를 입력해 주세요', 'warning')
      return
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

  const handlePlay = async (job: DownloadJob): Promise<void> => {
    const res = await window.api.openPlayer({ id: job.id })
    if (!res.success) {
      console.error('Failed to open player:', res.message)
      showToast(res.message ?? '재생할 수 없는 항목입니다', 'error')
    }
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
        const oldJob = jobsRef.current.find((j) => j.id === ev.job.id)

        setJobs((prev) => sortJobs(prev.map((j) => (j.id !== ev.job.id ? j : ev.job))))

        if (oldJob?.status !== 'completed' && ev.job.status === 'completed') {
          showToast(`✨ "${inferTitle(ev.job)}" 다운로드 완료!`, 'success')
        }
        if (oldJob?.status !== 'failed' && ev.job.status === 'failed') {
          const errorInfo = getErrorMessage(ev.job.error)
          showToast(`❌ ${errorInfo.title}`, 'error')
        }

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
          inputValue={inputValue}
          recentUrls={recentUrls}
          submitting={submitting}
          onChangeInputValue={setInputValue}
          onClearRecentUrls={handleClearRecentUrls}
          onRemoveRecentUrl={handleRemoveRecentUrl}
          onSelectRecentUrl={handleSelectRecentUrl}
          onSubmit={() => void handleDownloadInfo(inputValue)}
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
            <DownloadsEmptyState />
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
                  onPlay={handlePlay}
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
