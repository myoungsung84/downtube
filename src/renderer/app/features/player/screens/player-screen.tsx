import { Box } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'
import { useI18n } from '@renderer/shared/hooks/use-i18n'
import { useToast } from '@renderer/shared/hooks/use-toast'
import { resolveAppErrorMessage } from '@renderer/shared/lib/app-error'
import clamp from 'lodash/clamp'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useSettingsStore } from '../../settings/store/use-settings-store'
import { PlayerControls } from '../components/controls/player-controls'
import { AudioPlayerPanel } from '../components/surfaces/player-audio-panel'
import { PlayerEmptyState } from '../components/surfaces/player-empty-state'
import { PlayerVideoSurface } from '../components/surfaces/player-video-surface'
import { PlayerAudioAmbientParticles } from '../components/visuals/player-audio-ambient-particles'
import PlayerAudioVisualizerOverlay from '../components/visuals/player-audio-visualizer-overlay'
import {
  AUDIO_EXTENSIONS,
  buildInitialMediaInfo,
  buildPlayerQueue,
  clampSeekTime,
  cycleRepeatMode,
  getFileExtension,
  getFileNameFromPath,
  getFileNameWithoutExtension,
  getPlayerPathsFromHash,
  isFiniteDuration,
  removeQueueItemAtIndex,
  resolveInitialMediaKind,
  resolveNextQueueIndex,
  resolvePreviousQueueIndex,
  sanitizePlaybackTime,
  toMediaUrl
} from '../lib'
import type { MediaInfo, MediaKind, PlayerQueueItem, PlayerRepeatMode } from '../types/player.types'

const volSliderSx: SxProps<Theme> = {
  color: 'common.white',
  height: 3,
  width: 80,
  padding: '10px 0',
  '& .MuiSlider-thumb': {
    width: 13,
    height: 13,
    backgroundColor: 'common.white',
    boxShadow: (theme) => `0 1px 4px ${alpha(theme.palette.common.black, 0.5)}`,
    '&:before': { display: 'none' },
    '&:hover, &.Mui-focusVisible': {
      boxShadow: (theme) => `0 0 0 6px ${alpha(theme.palette.common.white, 0.2)}`
    }
  },
  '& .MuiSlider-rail': {
    backgroundColor: (theme) => alpha(theme.palette.common.white, 0.25),
    opacity: 1
  },
  '& .MuiSlider-track': { border: 'none' }
}

const PLAYER_VOLUME_KEY = 'player.volume' as const
const PLAYER_MUTED_KEY = 'player.muted' as const
const PLAYER_VISUALIZER_KEY = 'player.visualizerEnabled' as const
const PLAYER_AMBIENT_PARTICLES_KEY = 'player.ambientParticlesEnabled' as const

type QueueNavigationMode = 'current' | 'next' | 'previous'

function resolveCandidateIndex(
  mode: QueueNavigationMode,
  queueLength: number,
  candidateIndex: number,
  repeatMode: PlayerRepeatMode
): number | null {
  if (queueLength === 0) return null

  if (mode === 'current') {
    return clamp(candidateIndex, 0, queueLength - 1)
  }

  if (mode === 'next') {
    if (candidateIndex < queueLength) return candidateIndex
    return repeatMode === 'all' ? 0 : null
  }

  if (candidateIndex >= 0) return candidateIndex
  return repeatMode === 'all' ? queueLength - 1 : null
}

export default function PlayerScreen(): React.JSX.Element {
  const { t } = useI18n('player')
  const { showToast } = useToast()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seekbarRef = useRef<HTMLDivElement | null>(null)
  const ambientAudioLevelRef = useRef(0)
  const mediaMetaRequestIdRef = useRef(0)
  const queueRef = useRef<PlayerQueueItem[]>([])
  const currentIndexRef = useRef(0)
  const repeatModeRef = useRef<PlayerRepeatMode>('off')
  const hydrateSettings = useSettingsStore((state) => state.hydrateSettings)
  const setSettingValue = useSettingsStore((state) => state.setValue)
  const storedVolume = useSettingsStore((state) => state.values[PLAYER_VOLUME_KEY])
  const storedMuted = useSettingsStore((state) => state.values[PLAYER_MUTED_KEY])
  const storedVisualizerVisible = useSettingsStore((state) => state.values[PLAYER_VISUALIZER_KEY])
  const storedAmbientParticlesEnabled = useSettingsStore(
    (state) => state.values[PLAYER_AMBIENT_PARTICLES_KEY]
  )

  const hash = window.location.hash
  const initialPaths = useMemo(() => getPlayerPathsFromHash(hash), [hash])

  const [queue, setQueue] = useState<PlayerQueueItem[]>(() => buildPlayerQueue(initialPaths))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [repeatMode, setRepeatMode] = useState<PlayerRepeatMode>('off')
  const [mediaInfo, setMediaInfo] = useState<MediaInfo>(() => buildInitialMediaInfo(''))
  const [currentTime, setCurrentTime] = useState(0)
  const [mediaKind, setMediaKind] = useState<MediaKind>('unknown')
  const [hasLoadedMetadata, setHasLoadedMetadata] = useState(false)
  const [paused, setPaused] = useState(false)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [uiVisible, setUiVisible] = useState(true)
  const [seeking, setSeeking] = useState(false)
  const [seekValue, setSeekValue] = useState(0)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [hoverX, setHoverX] = useState(0)
  const [visualizerVisible, setVisualizerVisible] = useState(false)
  const [ambientParticlesEnabled, setAmbientParticlesEnabled] = useState(false)
  const [queuePanelOpen, setQueuePanelOpen] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    queueRef.current = queue
  }, [queue])

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  useEffect(() => {
    repeatModeRef.current = repeatMode
  }, [repeatMode])

  useEffect(() => {
    const nextQueue = buildPlayerQueue(initialPaths)
    setQueue(nextQueue)
    setCurrentIndex(0)
    setRepeatMode('off')
  }, [initialPaths])

  const currentItem = queue[currentIndex] ?? null
  const mediaPath = currentItem?.mediaPath ?? ''
  const videoSrc = currentItem?.mediaSrc ?? ''
  const fileName = currentItem?.fileName ?? getFileNameFromPath(mediaPath)
  const fileExtension = useMemo(() => getFileExtension(fileName), [fileName])
  const fileNameWithoutExt = useMemo(() => getFileNameWithoutExtension(fileName), [fileName])
  const lowerFileExtension = useMemo(() => fileExtension.toLowerCase(), [fileExtension])
  const upperFileExtension = useMemo(() => fileExtension.toUpperCase(), [fileExtension])
  const knownAudioExtension = useMemo(
    () => AUDIO_EXTENSIONS.has(lowerFileExtension),
    [lowerFileExtension]
  )

  const isAudioFile = useMemo(() => {
    if (knownAudioExtension) return true
    if (lowerFileExtension !== 'webm') return false
    if (!hasLoadedMetadata) return false
    return mediaKind === 'audio'
  }, [hasLoadedMetadata, knownAudioExtension, lowerFileExtension, mediaKind])

  const thumbnailSrc = useMemo(() => toMediaUrl(currentItem?.thumbnailPath), [currentItem])
  const primaryText = useMemo(
    () =>
      currentItem?.title?.trim() || fileNameWithoutExt || fileName || t('fallback.unknown_file'),
    [currentItem, fileName, fileNameWithoutExt, t]
  )
  const secondaryText = useMemo(
    () => currentItem?.artist?.trim() || undefined,
    [currentItem?.artist]
  )
  const canGoPrevious = useMemo(
    () =>
      queue.length > 1 &&
      resolvePreviousQueueIndex(queue.length, currentIndex, repeatMode) !== null,
    [currentIndex, queue.length, repeatMode]
  )
  const canGoNext = useMemo(
    () =>
      queue.length > 1 && resolveNextQueueIndex(queue.length, currentIndex, repeatMode) !== null,
    [currentIndex, queue.length, repeatMode]
  )

  const nextQueueIndex = useMemo(
    () => resolveNextQueueIndex(queue.length, currentIndex, repeatMode),
    [queue.length, currentIndex, repeatMode]
  )
  const nextQueueItem = nextQueueIndex !== null ? (queue[nextQueueIndex] ?? null) : null
  const nextItemLabel = useMemo(() => {
    if (!nextQueueItem) return undefined
    return (
      nextQueueItem.title?.trim() ||
      getFileNameWithoutExtension(nextQueueItem.fileName) ||
      nextQueueItem.fileName ||
      undefined
    )
  }, [nextQueueItem])

  const showLoadingOverlay = isTransitioning || (!hasLoadedMetadata && !!videoSrc)

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }, [])

  const applyPlaybackRateToElement = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.playbackRate !== playbackRate) {
      video.playbackRate = playbackRate
    }
  }, [playbackRate])

  const syncStaticMediaMeta = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const nextInfo: MediaInfo = {
      fileName,
      duration: isFiniteDuration(video.duration) ? video.duration : 0,
      width: video.videoWidth,
      height: video.videoHeight
    }

    setMediaInfo((prev) =>
      prev.fileName === nextInfo.fileName &&
      prev.duration === nextInfo.duration &&
      prev.width === nextInfo.width &&
      prev.height === nextInfo.height
        ? prev
        : nextInfo
    )
  }, [fileName])

  const syncCurrentTime = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    const nextTime = sanitizePlaybackTime(video.currentTime)
    setCurrentTime((prev) => (prev === nextTime ? prev : nextTime))
    if (!seeking) {
      setSeekValue((prev) => (prev === nextTime ? prev : nextTime))
    }
  }, [seeking])

  const resolveWebmMediaKind = useCallback(() => {
    if (lowerFileExtension !== 'webm') return
    const video = videoRef.current
    if (!video) return

    const nextKind: MediaKind = video.videoWidth > 0 || video.videoHeight > 0 ? 'video' : 'audio'
    setMediaKind((prev) => (prev === nextKind ? prev : nextKind))
  }, [lowerFileExtension])

  const syncMediaReadyState = useCallback(() => {
    setHasLoadedMetadata(true)
    setIsTransitioning(false)
    syncStaticMediaMeta()
    syncCurrentTime()
    resolveWebmMediaKind()
    applyPlaybackRateToElement()
  }, [applyPlaybackRateToElement, resolveWebmMediaKind, syncCurrentTime, syncStaticMediaMeta])

  const resetPlayerStateForSource = useCallback(() => {
    clearHideTimer()
    setMediaInfo(buildInitialMediaInfo(fileName))
    setCurrentTime(0)
    setSeekValue(0)
    setSeeking(false)
    setHoverTime(null)
    setPaused(false)
    setUiVisible(true)
    setHasLoadedMetadata(false)
    setMediaKind(resolveInitialMediaKind(lowerFileExtension))
  }, [clearHideTimer, fileName, lowerFileExtension])

  const applyStoredVolumeAndMuted = useCallback(() => {
    const video = videoRef.current

    if (typeof storedVolume === 'number') {
      setVolume((prev) => (prev === storedVolume ? prev : storedVolume))
      if (video && video.volume !== storedVolume) {
        video.volume = storedVolume
      }
    }

    if (typeof storedMuted === 'boolean') {
      setMuted((prev) => (prev === storedMuted ? prev : storedMuted))
      if (video && video.muted !== storedMuted) {
        video.muted = storedMuted
      }
    }

    if (typeof storedVisualizerVisible === 'boolean') {
      setVisualizerVisible((prev) =>
        prev === storedVisualizerVisible ? prev : storedVisualizerVisible
      )
    }

    if (typeof storedAmbientParticlesEnabled === 'boolean') {
      setAmbientParticlesEnabled((prev) =>
        prev === storedAmbientParticlesEnabled ? prev : storedAmbientParticlesEnabled
      )
    }
  }, [storedAmbientParticlesEnabled, storedMuted, storedVisualizerVisible, storedVolume])

  const maybeScheduleHideUi = useCallback(() => {
    clearHideTimer()
    hideTimer.current = setTimeout(() => {
      const video = videoRef.current
      if (video && !video.paused) {
        setUiVisible(false)
      }
    }, 3000)
  }, [clearHideTimer])

  const showUi = useCallback(() => {
    setUiVisible(true)
    maybeScheduleHideUi()
  }, [maybeScheduleHideUi])

  const applyQueueState = useCallback((nextQueue: PlayerQueueItem[], nextIndex: number): void => {
    setQueue(nextQueue)
    setCurrentIndex(nextQueue.length === 0 ? 0 : clamp(nextIndex, 0, nextQueue.length - 1))
  }, [])

  const stopPlayback = useCallback(() => {
    setIsTransitioning(false)
    const video = videoRef.current
    if (!video) {
      setPaused(true)
      return
    }

    video.pause()
    setPaused(true)
  }, [])

  const moveToPlayableIndex = useCallback(
    async (startIndex: number, mode: QueueNavigationMode): Promise<boolean> => {
      let workingQueue = [...queueRef.current]
      let workingCurrentIndex = currentIndexRef.current
      let candidateIndex = startIndex

      while (workingQueue.length > 0) {
        const normalizedCandidateIndex = resolveCandidateIndex(
          mode,
          workingQueue.length,
          candidateIndex,
          repeatModeRef.current
        )

        if (normalizedCandidateIndex === null) {
          applyQueueState(workingQueue, workingCurrentIndex)
          return false
        }

        candidateIndex = normalizedCandidateIndex
        const candidate = workingQueue[candidateIndex]
        if (!candidate) {
          applyQueueState(workingQueue, workingCurrentIndex)
          return false
        }

        if (await window.api.fileExists(candidate.mediaPath)) {
          applyQueueState(workingQueue, candidateIndex)
          return true
        }

        const removal = removeQueueItemAtIndex(workingQueue, workingCurrentIndex, candidateIndex)
        workingQueue = removal.queue
        workingCurrentIndex = removal.currentIndex

        if (mode === 'previous') {
          candidateIndex -= 1
        }
      }

      applyQueueState([], 0)
      stopPlayback()
      return false
    },
    [applyQueueState, stopPlayback]
  )

  const handleVideoError = useCallback(
    (event: React.SyntheticEvent<HTMLVideoElement>): void => {
      console.error('[player] media load error', {
        src: videoSrc,
        error: event.currentTarget.error
      })
    },
    [videoSrc]
  )

  const handleOpenFolder = useCallback(async (): Promise<void> => {
    if (!mediaPath) return
    const result = await window.api.openDownloadItem(mediaPath)
    if (!result.success) {
      showToast(resolveAppErrorMessage(result.error), 'error')
    }
  }, [mediaPath, showToast])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.paused ? void video.play() : video.pause()
  }, [])

  const skip = useCallback(
    (seconds: number) => {
      const video = videoRef.current
      if (!video) return
      const nextTime = isFiniteDuration(video.duration)
        ? clampSeekTime(video.currentTime + seconds, video.duration)
        : Math.max(0, sanitizePlaybackTime(video.currentTime) + seconds)
      video.currentTime = nextTime
      setCurrentTime((prev) => (prev === nextTime ? prev : nextTime))
      if (!seeking) {
        setSeekValue((prev) => (prev === nextTime ? prev : nextTime))
      }
    },
    [seeking]
  )

  const handleVolumeChange = useCallback((_: Event, val: number | number[]) => {
    const nextVolume = Array.isArray(val) ? val[0] : val
    const video = videoRef.current
    if (!video) return

    const nextMuted = nextVolume === 0
    video.volume = nextVolume
    video.muted = nextMuted
    setVolume((prev) => (prev === nextVolume ? prev : nextVolume))
    setMuted((prev) => (prev === nextMuted ? prev : nextMuted))
  }, [])

  const handleVolumeCommit = useCallback(
    (_: React.SyntheticEvent | Event, val: number | number[]) => {
      const nextVolume = Array.isArray(val) ? val[0] : val
      const nextMuted = nextVolume === 0
      void setSettingValue(PLAYER_VOLUME_KEY, nextVolume)
      void setSettingValue(PLAYER_MUTED_KEY, nextMuted)
    },
    [setSettingValue]
  )

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    const nextMuted = !video.muted
    video.muted = nextMuted
    setMuted((prev) => (prev === nextMuted ? prev : nextMuted))
    void setSettingValue(PLAYER_MUTED_KEY, nextMuted)
  }, [setSettingValue])

  const handleSeekChange = useCallback(
    (_: Event, val: number | number[]) => {
      const nextValue = Array.isArray(val) ? val[0] : val
      const clampedValue = clampSeekTime(nextValue, mediaInfo.duration)
      setSeekValue((prev) => (prev === clampedValue ? prev : clampedValue))
      setSeeking(true)
    },
    [mediaInfo.duration]
  )

  const handleSeekCommit = useCallback(
    (_: React.SyntheticEvent | Event, val: number | number[]) => {
      const video = videoRef.current
      const nextValue = Array.isArray(val) ? val[0] : val
      const duration = video?.duration ?? mediaInfo.duration
      const clampedValue = clampSeekTime(nextValue, duration)
      setSeekValue((prev) => (prev === clampedValue ? prev : clampedValue))

      if (video) {
        video.currentTime = clampedValue
      }

      setCurrentTime((prev) => (prev === clampedValue ? prev : clampedValue))
      setSeeking(false)
    },
    [mediaInfo.duration]
  )

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    document.fullscreenElement ? void document.exitFullscreen() : void el.requestFullscreen()
  }, [])

  const handleSeekbarMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1)
      if (isFiniteDuration(mediaInfo.duration) && mediaInfo.duration > 0) {
        setHoverTime(ratio * mediaInfo.duration)
        setHoverX(event.clientX - rect.left)
      }
    },
    [mediaInfo.duration]
  )

  const handleSeekbarMouseLeave = useCallback(() => setHoverTime(null), [])

  const handleNext = useCallback(async (): Promise<void> => {
    const nextIndex = resolveNextQueueIndex(
      queueRef.current.length,
      currentIndexRef.current,
      repeatModeRef.current
    )

    if (nextIndex === null) {
      stopPlayback()
      return
    }

    setIsTransitioning(true)
    await moveToPlayableIndex(nextIndex, 'next')
  }, [moveToPlayableIndex, stopPlayback])

  const handlePrevious = useCallback(async (): Promise<void> => {
    const previousIndex = resolvePreviousQueueIndex(
      queueRef.current.length,
      currentIndexRef.current,
      repeatModeRef.current
    )

    if (previousIndex === null) {
      return
    }

    setIsTransitioning(true)
    await moveToPlayableIndex(previousIndex, 'previous')
  }, [moveToPlayableIndex])

  const handleQueueItemClick = useCallback(
    async (index: number): Promise<void> => {
      if (index === currentIndexRef.current) return
      setIsTransitioning(true)
      await moveToPlayableIndex(index, 'current')
    },
    [moveToPlayableIndex]
  )

  const handleEnded = useCallback(() => {
    const video = videoRef.current

    if (repeatModeRef.current === 'one') {
      if (!video) return
      video.currentTime = 0
      void video.play()
      return
    }

    void handleNext()
  }, [handleNext])

  useEffect(() => {
    resetPlayerStateForSource()
  }, [resetPlayerStateForSource])

  useEffect(() => {
    void hydrateSettings([
      PLAYER_VOLUME_KEY,
      PLAYER_MUTED_KEY,
      PLAYER_VISUALIZER_KEY,
      PLAYER_AMBIENT_PARTICLES_KEY
    ])
  }, [hydrateSettings])

  useEffect(() => {
    applyStoredVolumeAndMuted()
  }, [applyStoredVolumeAndMuted])

  useEffect(() => {
    applyPlaybackRateToElement()
  }, [applyPlaybackRateToElement, videoSrc])

  useEffect(() => {
    if (!currentItem?.mediaPath) return
    void moveToPlayableIndex(currentIndexRef.current, 'current')
  }, [currentItem?.mediaPath, moveToPlayableIndex])

  useEffect(() => {
    const requestId = ++mediaMetaRequestIdRef.current

    if (!currentItem?.mediaPath) return

    void (async () => {
      const result = await window.api.readMediaSidecar(currentItem.mediaPath)
      if (mediaMetaRequestIdRef.current !== requestId || !result.success) return

      setQueue((prev) =>
        prev.map((item) =>
          item.mediaPath !== currentItem.mediaPath
            ? item
            : {
                ...item,
                title: result.title ?? item.title,
                artist: result.artist ?? item.artist,
                thumbnailPath: result.thumbnailPath ?? item.thumbnailPath
              }
        )
      )
    })()
  }, [currentItem?.mediaPath])

  // Hydrate all queue items (title/artist/thumbnail) when the queue is first built.
  // This ensures the queue panel shows consistent labels for every item upfront.
  useEffect(() => {
    const paths = initialPaths.map((p) => p.trim()).filter(Boolean)
    if (paths.length <= 1) return // Single item is handled by the currentItem effect above

    let cancelled = false

    void Promise.all(
      paths.map(async (mediaPath) => {
        const result = await window.api.readMediaSidecar(mediaPath)
        if (cancelled || !result.success) return
        setQueue((prev) =>
          prev.map((item) => {
            if (item.mediaPath !== mediaPath) return item
            const hasNewData = result.title ?? result.artist ?? result.thumbnailPath
            if (!hasNewData) return item
            return {
              ...item,
              title: result.title ?? item.title,
              artist: result.artist ?? item.artist,
              thumbnailPath: result.thumbnailPath ?? item.thumbnailPath
            }
          })
        )
      })
    )

    return () => {
      cancelled = true
    }
  }, [initialPaths])

  useEffect(() => {
    const onFsChange = (): void => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.target instanceof HTMLInputElement) return
      showUi()
      if (event.code === 'Space') {
        event.preventDefault()
        togglePlay()
      }
      if (event.code === 'ArrowLeft') skip(-10)
      if (event.code === 'ArrowRight') skip(10)
      if (event.code === 'KeyF') toggleFullscreen()
      if (event.code === 'KeyM') toggleMute()
      if (event.code === 'KeyQ') setQueuePanelOpen((prev) => !prev)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showUi, skip, toggleFullscreen, toggleMute, togglePlay])

  useEffect(() => {
    if (!paused) {
      maybeScheduleHideUi()
      return
    }

    clearHideTimer()
    setUiVisible(true)
  }, [clearHideTimer, maybeScheduleHideUi, paused])

  useEffect(
    () => () => {
      clearHideTimer()
    },
    [clearHideTimer]
  )

  const currentSeekVal = seeking ? seekValue : currentTime

  return (
    <Box
      ref={containerRef}
      onMouseMove={showUi}
      onMouseLeave={() => {
        if (!paused) {
          setUiVisible(false)
        }
      }}
      sx={{
        position: 'fixed',
        inset: 0,
        background: 'common.black',
        overflow: 'hidden',
        WebkitAppRegion: 'no-drag',
        cursor: uiVisible ? 'default' : 'none',
        userSelect: 'none'
      }}
    >
      {videoSrc ? (
        <>
          <PlayerVideoSurface
            videoRef={videoRef}
            src={videoSrc}
            isAudioFile={isAudioFile}
            onError={handleVideoError}
            onLoadedMetadata={syncMediaReadyState}
            onCanPlay={syncMediaReadyState}
            onPlay={() => setPaused(false)}
            onPause={() => setPaused(true)}
            onEnded={handleEnded}
            onSeeked={() => {
              syncStaticMediaMeta()
              syncCurrentTime()
              setSeeking(false)
            }}
            onTimeUpdate={syncCurrentTime}
            onClick={togglePlay}
            onDoubleClick={toggleFullscreen}
          />

          {isAudioFile ? (
            <AudioPlayerPanel
              paused={paused}
              visualizerVisible={visualizerVisible}
              thumbnailSrc={thumbnailSrc}
              primaryText={primaryText}
              secondaryText={secondaryText}
              upperFileExtension={upperFileExtension}
              onTogglePlay={togglePlay}
            />
          ) : null}

          <PlayerAudioAmbientParticles
            enabled={ambientParticlesEnabled}
            audioLevelRef={ambientAudioLevelRef}
          />

          <PlayerAudioVisualizerOverlay
            videoRef={videoRef}
            visible={visualizerVisible}
            seekbarRef={seekbarRef}
            analysisActive={visualizerVisible || ambientParticlesEnabled}
            audioLevelRef={ambientAudioLevelRef}
          />

          {/* Loading / transition overlay */}
          <>
            <style>{`
              @keyframes player-spin {
                0%   { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                zIndex: 5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: (theme) => alpha(theme.palette.common.black, 0.4),
                opacity: showLoadingOverlay ? 1 : 0,
                pointerEvents: showLoadingOverlay ? 'auto' : 'none',
                transition: 'opacity 0.25s ease'
              }}
            >
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  border: (theme) => `2px solid ${alpha(theme.palette.common.white, 0.12)}`,
                  borderTopColor: (theme) => alpha(theme.palette.error.main, 0.85),
                  animation: showLoadingOverlay ? 'player-spin 0.75s linear infinite' : 'none'
                }}
              />
            </Box>
          </>

          <PlayerControls
            uiVisible={uiVisible}
            visualizerVisible={visualizerVisible}
            ambientParticlesEnabled={ambientParticlesEnabled}
            queuePanelOpen={queuePanelOpen}
            paused={paused}
            playbackRate={playbackRate}
            isAudioFile={isAudioFile}
            meta={{
              width: mediaInfo.width,
              height: mediaInfo.height,
              duration: mediaInfo.duration
            }}
            fileExtension={fileExtension}
            primaryText={primaryText}
            secondaryText={secondaryText}
            hoverTime={hoverTime}
            hoverX={hoverX}
            currentSeekVal={currentSeekVal}
            muted={muted}
            volume={volume}
            currentIndex={currentIndex}
            queueLength={queue.length}
            queue={queue}
            repeatMode={repeatMode}
            isFullscreen={isFullscreen}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            nextItemLabel={nextItemLabel}
            seekbarRef={seekbarRef}
            volSliderSx={volSliderSx}
            onOpenFolder={handleOpenFolder}
            onChangePlaybackRate={(rate) => {
              const video = videoRef.current
              if (video) {
                video.playbackRate = rate
              }
              setPlaybackRate((prev) => (prev === rate ? prev : rate))
            }}
            onReplay10={() => skip(-10)}
            onTogglePlay={togglePlay}
            onForward10={() => skip(10)}
            onSeekbarMouseMove={handleSeekbarMouseMove}
            onSeekbarMouseLeave={handleSeekbarMouseLeave}
            onSeekChange={handleSeekChange}
            onSeekCommit={handleSeekCommit}
            onToggleMute={toggleMute}
            onVolumeChange={handleVolumeChange}
            onVolumeCommit={handleVolumeCommit}
            onPreviousTrack={() => void handlePrevious()}
            onNextTrack={() => void handleNext()}
            onCycleRepeatMode={() => setRepeatMode((prev) => cycleRepeatMode(prev))}
            onToggleVisualizer={() => {
              const nextVisible = !visualizerVisible
              setVisualizerVisible(nextVisible)
              void setSettingValue(PLAYER_VISUALIZER_KEY, nextVisible)
            }}
            onToggleAmbientParticles={() => {
              const nextEnabled = !ambientParticlesEnabled
              setAmbientParticlesEnabled(nextEnabled)
              void setSettingValue(PLAYER_AMBIENT_PARTICLES_KEY, nextEnabled)
            }}
            onToggleQueuePanel={() => setQueuePanelOpen((prev) => !prev)}
            onQueueItemClick={(index) => void handleQueueItemClick(index)}
            onToggleFullscreen={toggleFullscreen}
          />
        </>
      ) : (
        <PlayerEmptyState />
      )}
    </Box>
  )
}
