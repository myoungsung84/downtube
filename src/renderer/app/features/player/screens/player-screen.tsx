import { Box } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useSettingsStore } from '../../settings/store/use-settings-store'
import { PlayerControls } from '../components/controls/player-controls'
import { AudioPlayerPanel } from '../components/surfaces/player-audio-panel'
import { PlayerEmptyState } from '../components/surfaces/player-empty-state'
import { PlayerVideoSurface } from '../components/surfaces/player-video-surface'
import PlayerAudioVisualizerOverlay from '../components/visuals/player-audio-visualizer-overlay'
import {
  AUDIO_EXTENSIONS,
  buildInitialMediaInfo,
  clampSeekTime,
  getDecodedVideoSrc,
  getFileExtension,
  getFileNameFromVideoSrc,
  getFileNameWithoutExtension,
  getMediaPathFromVideoSrc,
  getPlayerSearchParamsFromHash,
  isFiniteDuration,
  resolveInitialMediaKind,
  sanitizePlaybackTime,
  toMediaUrl
} from '../lib'
import type { MediaInfo, MediaKind, SidecarMediaMeta } from '../types/player.types'

const seekSliderSx: SxProps<Theme> = {
  color: 'error.main',
  height: 2,
  padding: '10px 0',
  mx: 0,
  '& .MuiSlider-root': { padding: 0 },
  '& .MuiSlider-thumb': {
    width: 14,
    height: 14,
    backgroundColor: 'common.white',
    boxShadow: (theme) => `0 0 0 2px ${alpha(theme.palette.error.main, 0.5)}`,
    transition: 'box-shadow 0.15s',
    '&:before': { display: 'none' },
    '&:hover, &.Mui-focusVisible': {
      boxShadow: (theme) => `0 0 0 8px ${alpha(theme.palette.error.main, 0.25)}`
    }
  },
  '& .MuiSlider-rail': {
    backgroundColor: (theme) => alpha(theme.palette.common.white, 0.25),
    opacity: 1
  },
  '& .MuiSlider-track': {
    border: 'none',
    backgroundColor: 'error.main',
    opacity: 1
  }
}

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
export default function PlayerScreen(): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seekbarRef = useRef<HTMLDivElement | null>(null)
  const mediaMetaRequestIdRef = useRef(0)
  const hydrateSettings = useSettingsStore((state) => state.hydrateSettings)
  const setSettingValue = useSettingsStore((state) => state.setValue)
  const storedVolume = useSettingsStore((state) => state.values[PLAYER_VOLUME_KEY])
  const storedMuted = useSettingsStore((state) => state.values[PLAYER_MUTED_KEY])
  const storedVisualizerVisible = useSettingsStore((state) => state.values[PLAYER_VISUALIZER_KEY])

  const hash = window.location.hash
  const searchParams = useMemo(() => getPlayerSearchParamsFromHash(hash), [hash])
  const rawVideoSrc = useMemo(() => searchParams.get('src') ?? '', [searchParams])
  const videoSrc = useMemo(() => getDecodedVideoSrc(rawVideoSrc), [rawVideoSrc])
  const fileName = useMemo(() => getFileNameFromVideoSrc(videoSrc), [videoSrc])
  const mediaPath = useMemo(() => getMediaPathFromVideoSrc(videoSrc), [videoSrc])
  const fileExtension = useMemo(() => getFileExtension(fileName), [fileName])
  const fileNameWithoutExt = useMemo(() => getFileNameWithoutExtension(fileName), [fileName])
  const lowerFileExtension = useMemo(() => fileExtension.toLowerCase(), [fileExtension])
  const upperFileExtension = useMemo(() => fileExtension.toUpperCase(), [fileExtension])
  const knownAudioExtension = useMemo(
    () => AUDIO_EXTENSIONS.has(lowerFileExtension),
    [lowerFileExtension]
  )

  const [mediaInfo, setMediaInfo] = useState<MediaInfo>(() => buildInitialMediaInfo(fileName))
  const [currentTime, setCurrentTime] = useState(0)
  const [mediaKind, setMediaKind] = useState<MediaKind>(() =>
    resolveInitialMediaKind(lowerFileExtension)
  )
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
  const [mediaMeta, setMediaMeta] = useState<SidecarMediaMeta>({})

  const isAudioFile = useMemo(() => {
    if (knownAudioExtension) return true
    if (lowerFileExtension !== 'webm') return false
    if (!hasLoadedMetadata) return false
    return mediaKind === 'audio'
  }, [hasLoadedMetadata, knownAudioExtension, lowerFileExtension, mediaKind])

  const thumbnailSrc = useMemo(() => toMediaUrl(mediaMeta.thumbnailPath), [mediaMeta.thumbnailPath])
  const primaryText = useMemo(
    () => mediaMeta.title?.trim() || fileNameWithoutExt || fileName || '알 수 없는 파일',
    [fileName, fileNameWithoutExt, mediaMeta.title]
  )
  const secondaryText = useMemo(() => {
    if (!mediaMeta.title) return undefined
    return mediaMeta.artist?.trim() || undefined
  }, [mediaMeta.artist, mediaMeta.title])
  const videoObjectFit = useMemo(() => {
    if (isAudioFile) return 'contain'
    if (mediaInfo.width <= 0 || mediaInfo.height <= 0) return 'contain'
    return mediaInfo.width >= mediaInfo.height ? 'cover' : 'contain'
  }, [isAudioFile, mediaInfo.height, mediaInfo.width])

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
  }, [storedMuted, storedVisualizerVisible, storedVolume])

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
    await window.api.openDownloadItem(mediaPath)
  }, [mediaPath])

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
      const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
      if (isFiniteDuration(mediaInfo.duration) && mediaInfo.duration > 0) {
        setHoverTime(ratio * mediaInfo.duration)
        setHoverX(event.clientX - rect.left)
      }
    },
    [mediaInfo.duration]
  )

  const handleSeekbarMouseLeave = useCallback(() => setHoverTime(null), [])

  useEffect(() => {
    resetPlayerStateForSource()
  }, [resetPlayerStateForSource])

  useEffect(() => {
    void hydrateSettings([PLAYER_VOLUME_KEY, PLAYER_MUTED_KEY, PLAYER_VISUALIZER_KEY])
  }, [hydrateSettings])

  useEffect(() => {
    applyStoredVolumeAndMuted()
  }, [applyStoredVolumeAndMuted])

  useEffect(() => {
    applyPlaybackRateToElement()
  }, [applyPlaybackRateToElement, videoSrc])

  useEffect(() => {
    const requestId = ++mediaMetaRequestIdRef.current
    setMediaMeta({})

    if (!mediaPath) return

    void (async () => {
      const result = await window.api.readMediaSidecar(mediaPath)
      if (mediaMetaRequestIdRef.current !== requestId) return

      if (!result.success) {
        setMediaMeta({})
        return
      }

      setMediaMeta({
        title: result.title,
        artist: result.artist,
        thumbnailPath: result.thumbnailPath
      })
    })()
  }, [mediaPath])

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
        width: '100vw',
        height: '100vh',
        background: 'common.black',
        overflow: 'hidden',
        position: 'relative',
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
            videoObjectFit={videoObjectFit}
            onError={handleVideoError}
            onLoadedMetadata={syncMediaReadyState}
            onCanPlay={syncMediaReadyState}
            onPlay={() => setPaused(false)}
            onPause={() => setPaused(true)}
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

          <PlayerAudioVisualizerOverlay
            videoRef={videoRef}
            visible={visualizerVisible}
            seekbarRef={seekbarRef}
          />

          <PlayerControls
            uiVisible={uiVisible}
            visualizerVisible={visualizerVisible}
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
            isFullscreen={isFullscreen}
            seekbarRef={seekbarRef}
            seekSliderSx={seekSliderSx}
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
            onToggleVisualizer={() => {
              const nextVisible = !visualizerVisible
              setVisualizerVisible(nextVisible)
              void setSettingValue(PLAYER_VISUALIZER_KEY, nextVisible)
            }}
            onToggleFullscreen={toggleFullscreen}
          />
        </>
      ) : (
        <PlayerEmptyState />
      )}
    </Box>
  )
}
