import { Box, Stack } from '@mui/material'
import { useSettingsStore } from '@renderer/features/settings/store/use-settings-store'
import { useI18n } from '@renderer/shared/hooks/use-i18n'
import { useToast } from '@renderer/shared/hooks/use-toast'
import type { DownloadJob, DownloadQueueEvent } from '@src/types/download.types'
import type { RecentUrlHistoryItem } from '@src/types/settings.types'
import clamp from 'lodash/clamp'
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
  normalizeRecentUrlHistory,
  sortJobs,
  updateRecentUrlHistory,
  updateRecentUrlHistoryTitle
} from '../lib/downloads-utils'

const DOWNLOADS_DEFAULT_TYPE_KEY = 'downloads.defaultType' as const
const DOWNLOADS_PLAYLIST_LIMIT_KEY = 'downloads.playlistLimit' as const
const DOWNLOADS_RECENT_URLS_KEY = 'downloads.recentUrls' as const

export default function DownloadsScreen(): React.JSX.Element {
  const refUrl = useRef<HTMLInputElement>(null)

  const { t } = useI18n('downloads')
  const { showToast } = useToast()
  const hydrateSettings = useSettingsStore((state) => state.hydrateSettings)
  const setSettingValue = useSettingsStore((state) => state.setValue)

  const [jobs, setJobs] = useState<DownloadJob[]>([])
  const [hydrating, setHydrating] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [pendingFocusUrl, setPendingFocusUrl] = useState<string | undefined>(undefined)

  const [queueRunning, setQueueRunning] = useState(false)
  const [queuePaused, setQueuePaused] = useState(true)
  const [currentJobId, setCurrentJobId] = useState<string | undefined>(undefined)

  const [submitting, setSubmitting] = useState<null | { url: string; kind: 'playlist' | 'single' }>(
    null
  )
  const jobsRef = useRef<DownloadJob[]>([])
  const recentUrlsRef = useRef<RecentUrlHistoryItem[]>([])
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
  const recentUrls = useMemo(
    () =>
      Array.isArray(storedRecentUrls)
        ? normalizeRecentUrlHistory(storedRecentUrls, isPlaylistUrl)
        : [],
    [storedRecentUrls]
  )

  const queuedCount = useMemo(() => jobs.filter((j) => j.status === 'queued').length, [jobs])
  const hasQueued = queuedCount > 0
  const runningCount = useMemo(() => jobs.filter((j) => j.status === 'running').length, [jobs])
  const completedCount = useMemo(() => jobs.filter((j) => j.status === 'completed').length, [jobs])
  const failedCount = useMemo(() => jobs.filter((j) => j.status === 'failed').length, [jobs])

  const queueLabel = useMemo(() => {
    if (queueRunning && queuePaused) return t('queue.status.pausing')
    if (queueRunning) return t('queue.status.running')
    if (queuePaused && hasQueued) return t('queue.status.paused')
    if (hasQueued) return t('queue.status.queued')
    return t('queue.status.ready')
  }, [hasQueued, queuePaused, queueRunning, t])

  const canStart = hasQueued && (!queueRunning || queuePaused)
  const canPause = queueRunning && !queuePaused

  useEffect(() => {
    jobsRef.current = jobs
  }, [jobs])

  useEffect(() => {
    recentUrlsRef.current = recentUrls
  }, [recentUrls])

  useEffect(() => {
    void hydrateSettings([
      DOWNLOADS_DEFAULT_TYPE_KEY,
      DOWNLOADS_PLAYLIST_LIMIT_KEY,
      DOWNLOADS_RECENT_URLS_KEY
    ])
  }, [hydrateSettings])

  const persistRecentUrl = (item: RecentUrlHistoryItem): void => {
    const nextRecentUrls = updateRecentUrlHistory(recentUrlsRef.current, item)
    void setSettingValue(DOWNLOADS_RECENT_URLS_KEY, nextRecentUrls)
  }

  const handleSelectRecentUrl = (item: RecentUrlHistoryItem): void => {
    setInputValue(item.url)
    setPendingFocusUrl(item.url)
  }

  useEffect(() => {
    if (pendingFocusUrl === undefined) return
    const input = refUrl.current
    if (!input) return
    input.focus()
    input.setSelectionRange(pendingFocusUrl.length, pendingFocusUrl.length)
    setPendingFocusUrl(undefined)
  }, [pendingFocusUrl])

  const handleRemoveRecentUrl = (url: string): void => {
    void setSettingValue(
      DOWNLOADS_RECENT_URLS_KEY,
      recentUrls.filter((item) => item.url !== url)
    )
  }

  const handleClearRecentUrls = (): void => {
    void setSettingValue(DOWNLOADS_RECENT_URLS_KEY, [])
  }

  const handleDownloadInfo = async (inputUrl: string): Promise<void> => {
    const url = inputUrl.trim()
    if (!url) {
      showToast(t('toast.validation.enter_url'), 'warning')
      return
    }
    if (!isYoutubeUrl(url)) {
      showToast(t('toast.validation.invalid_url'), 'warning')
      return
    }

    const kind: 'playlist' | 'single' = isPlaylistUrl(url) ? 'playlist' : 'single'
    setSubmitting({ url, kind })
    persistRecentUrl({
      url,
      kind,
      title: t(kind === 'playlist' ? 'history.kind.playlist' : 'history.kind.video')
    })

    try {
      if (kind === 'playlist') {
        const clampedLimit = clamp(playlistLimit, 1, 500)
        await window.api.downloadPlaylist({
          url,
          type: defaultType,
          playlistLimit: clampedLimit
        })
        showToast(t('toast.submit.playlist_added', { count: clampedLimit }), 'success')
      } else {
        if (defaultType === 'audio') await window.api.downloadAudio(url)
        else await window.api.download(url)

        showToast(t('toast.submit.single_added'), 'success')
      }

      setInputValue('')
    } catch {
      showToast(t('toast.submit.failed'), 'error')
    } finally {
      setSubmitting(null)
    }
  }

  const handleToggleType = async (jobId: string, type: 'video' | 'audio'): Promise<void> => {
    await window.api.setDownloadType({ id: jobId, type })
    showToast(
      t('toast.actions.type_changed', {
        type: t(type === 'audio' ? 'media.audio' : 'media.video')
      }),
      'info'
    )
  }

  const handleStop = async (job: DownloadJob): Promise<void> => {
    await window.api.stopDownload(job.url)
    showToast(t('toast.actions.stopped'), 'info')
  }

  const handleRetry = async (job: DownloadJob): Promise<void> => {
    if (job.status === 'cancelled') await window.api.removeDownload(job.id)

    if (!isYoutubeUrl(job.url)) {
      showToast(t('toast.retry.invalid_url'), 'warning')
      return
    }

    const kind: 'playlist' | 'single' = isPlaylistUrl(job.url) ? 'playlist' : 'single'
    setSubmitting({ url: job.url, kind })

    try {
      if (kind === 'playlist') {
        await window.api.downloadPlaylist({
          url: job.url,
          type: job.type,
          playlistLimit: clamp(playlistLimit, 1, 500)
        })
      } else if (job.type === 'audio') {
        await window.api.downloadAudio(job.url)
      } else {
        await window.api.download(job.url)
      }

      showToast(t('toast.retry.started'), 'info')
    } catch {
      showToast(t('toast.retry.failed'), 'error')
    } finally {
      setSubmitting(null)
    }
  }

  const handleDelete = async (job: DownloadJob): Promise<void> => {
    if (job.status === 'running') return
    await window.api.removeDownload(job.id)
    showToast(t('toast.actions.deleted'), 'info')
  }

  const handlePlay = async (job: DownloadJob): Promise<void> => {
    const filePath = job.finalFilePath ?? job.outputFile
    if (!filePath) {
      showToast(t('toast.player.unavailable'), 'error')
      return
    }

    const res = await window.api.openPlayer({ paths: [filePath] })
    if (!res.success) {
      console.error('Failed to open player:', res.message)
      showToast(res.message ?? t('toast.player.unavailable'), 'error')
    }
  }

  const handleStartQueue = async (): Promise<void> => {
    await window.api.downloadsStart()
    showToast(t('toast.queue.started'), 'success')
  }

  const handlePauseQueue = async (): Promise<void> => {
    await window.api.downloadsPause()
    showToast(t('toast.queue.paused'), 'info')
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
        const nextRecentUrls = updateRecentUrlHistoryTitle(
          recentUrlsRef.current,
          ev.job.url,
          ev.job.info?.title ?? ''
        )
        if (nextRecentUrls !== recentUrlsRef.current) {
          void setSettingValue(DOWNLOADS_RECENT_URLS_KEY, nextRecentUrls)
        }
        setJobs((prev) => sortJobs([...prev.filter((j) => j.id !== ev.job.id), ev.job]))
        return
      }

      if (ev.type === 'job-updated') {
        const oldJob = jobsRef.current.find((j) => j.id === ev.job.id)

        setJobs((prev) => sortJobs(prev.map((j) => (j.id !== ev.job.id ? j : ev.job))))

        if (oldJob?.status !== 'completed' && ev.job.status === 'completed') {
          showToast(t('toast.job.completed', { title: inferTitle(ev.job) }), 'success')
        }
        if (oldJob?.status !== 'failed' && ev.job.status === 'failed') {
          const errorInfo = getErrorMessage(ev.job.error)
          showToast(`❌ ${t(errorInfo.titleKey as never)}`, 'error')
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
  }, [setSettingValue, showToast, t])

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
