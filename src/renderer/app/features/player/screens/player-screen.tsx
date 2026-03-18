import { Box, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { alpha, keyframes } from '@mui/material/styles'
import Thumbnail from '@renderer/shared/components/ui/thumbnail'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useSettingsStore } from '../../settings/store/use-settings-store'
import PlayerAudioVisualizerOverlay from '../components/player-audio-visualizer-overlay'
import { PlayerControls } from '../components/player-controls'
import {
  getDecodedVideoSrc,
  getFileExtension,
  getFileNameFromVideoSrc,
  getFileNameWithoutExtension,
  getMediaPathFromVideoSrc,
  getPlayerSearchParamsFromHash
} from '../lib/player-query'

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0px rgba(255,255,255,0.08), 0 18px 42px rgba(0,0,0,0.35); }
  50%       { box-shadow: 0 0 0 6px rgba(255,255,255,0.10), 0 18px 42px rgba(0,0,0,0.35); }
`

const spinSlow = keyframes`
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
`

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
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'opus'])

type MediaKind = 'audio' | 'video' | 'unknown'
type MediaInfo = {
  fileName: string
  duration: number
  width: number
  height: number
}
type SidecarMediaMeta = {
  title?: string
  artist?: string
  thumbnailPath?: string
}

function toMediaUrl(filePath?: string): string | undefined {
  if (!filePath) return undefined
  const url = new URL('downtube-media://media')
  url.searchParams.set('path', filePath)
  return url.toString()
}

function isFiniteDuration(value: number): boolean {
  return Number.isFinite(value) && value >= 0
}

function sanitizePlaybackTime(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0
}

function clampSeekTime(value: number, duration: number): number {
  const safeValue = sanitizePlaybackTime(value)
  if (!isFiniteDuration(duration)) return safeValue
  return Math.max(0, Math.min(duration, safeValue))
}

function resolveInitialMediaKind(extension: string): MediaKind {
  if (AUDIO_EXTENSIONS.has(extension)) return 'audio'
  if (extension === 'webm') return 'unknown'
  return 'video'
}

function buildInitialMediaInfo(fileName: string): MediaInfo {
  return { fileName, duration: 0, width: 0, height: 0 }
}

function AudioThumbnailFallback({ size = 145 }: { size?: number }): React.JSX.Element {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 2,
        border: '1px solid rgba(255, 255, 255, 0.12)',
        backgroundColor: (theme) => alpha(theme.palette.common.white, 0.05),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <svg
        width={size * 0.42}
        height={size * 0.42}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.35 }}
      >
        <path
          d="M18 36V12l22-4v8L26 18v18a6 6 0 1 1-8 0ZM12 42a6 6 0 1 1 0-12 6 6 0 0 1 0 12Z"
          fill="white"
        />
      </svg>
    </Box>
  )
}

function PlayerBackgroundLayer({
  thumbnailSrc
}: {
  thumbnailSrc?: string
}): React.JSX.Element | null {
  if (!thumbnailSrc) return null

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: -24,
          backgroundImage: `url("${thumbnailSrc}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 28%',
          filter: 'blur(24px)',
          transform: 'scale(1.08)',
          opacity: 0.28
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: (theme) =>
            `linear-gradient(180deg, ${alpha(theme.palette.common.black, 0.36)} 0%, ${alpha(
              theme.palette.common.black,
              0.58
            )} 100%)`
        }}
      />
    </Box>
  )
}

function AudioPlayerPanel({
  paused,
  visualizerVisible,
  thumbnailSrc,
  primaryText,
  secondaryText,
  upperFileExtension,
  onTogglePlay
}: {
  paused: boolean
  visualizerVisible: boolean
  thumbnailSrc?: string
  primaryText: string
  secondaryText?: string
  upperFileExtension: string
  onTogglePlay: () => void
}): React.JSX.Element {
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        zIndex: 2
      }}
    >
      <Box
        onClick={onTogglePlay}
        role="button"
        aria-label={paused ? '재생' : '일시정지'}
        sx={{
          width: 'min(100%, 560px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          px: { xs: 2.5, sm: 3 },
          py: { xs: 3.5, sm: 4 },
          borderRadius: 3,
          background: (theme) =>
            `radial-gradient(circle at top, ${alpha(theme.palette.error.main, 0.12)} 0%, transparent 48%), ${alpha(theme.palette.common.black, 0.42)}`,
          border: (theme) => `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
          backdropFilter: 'blur(18px)',
          textAlign: 'center',
          cursor: 'pointer'
        }}
      >
        <Box
          sx={{
            cursor: 'pointer',
            position: 'relative',
            width: { xs: 220, sm: 260 },
            height: { xs: 220, sm: 260 },
            flexShrink: 0
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              animation: !paused ? `${spinSlow} 5s linear infinite` : 'none',
              animationPlayState: paused ? 'paused' : 'running',
              zIndex: 0,
              background: `
                radial-gradient(circle at 50% 50%,
                  #1a1a1a 0%,
                  #1a1a1a 21%,
                  #2e2e2e 22%,
                  #111 24%,
                  #2a2a2a 26%,
                  #111 28%,
                  #252525 30%,
                  #111 32%,
                  #222 34%,
                  #0e0e0e 36%,
                  #252525 38%,
                  #111 40%,
                  #222 42%,
                  #111 44%,
                  #1e1e1e 46%,
                  #0a0a0a 48%,
                  #1a1a1a 50%,
                  #0e0e0e 52%,
                  #1c1c1c 54%,
                  #0a0a0a 56%,
                  #181818 58%,
                  #0c0c0c 60%,
                  #161616 62%,
                  #0a0a0a 64%,
                  #141414 66%,
                  #080808 68%,
                  #121212 70%,
                  #080808 100%
                )
              `,
              boxShadow: '0 16px 48px rgba(0,0,0,0.85), 0 2px 8px rgba(0,0,0,0.5)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#0a0a0a',
                border: '1.5px solid rgba(255,255,255,0.12)',
                zIndex: 3
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: `
                  conic-gradient(
                    from 0deg,
                    rgba(255,255,255,0.0)  0deg,
                    rgba(255,255,255,0.06) 30deg,
                    rgba(255,255,255,0.0)  60deg,
                    rgba(255,255,255,0.08) 100deg,
                    rgba(255,255,255,0.0)  140deg,
                    rgba(255,255,255,0.05) 180deg,
                    rgba(255,255,255,0.0)  210deg,
                    rgba(255,255,255,0.07) 250deg,
                    rgba(255,255,255,0.0)  290deg,
                    rgba(255,255,255,0.06) 330deg,
                    rgba(255,255,255,0.0)  360deg
                  )
                `,
                zIndex: 1
              }
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 2,
              borderRadius: '50%',
              overflow: 'hidden',
              width: { xs: 124, sm: 145 },
              height: { xs: 124, sm: 145 },
              animation: !paused ? `${pulseGlow} 2.4s ease-in-out infinite` : 'none',
              opacity: paused ? 0.72 : 1,
              transition: 'opacity 0.25s ease',
              boxShadow: '0 0 0 3px rgba(255,255,255,0.08), 0 4px 20px rgba(0,0,0,0.6)',
              '&:hover': { opacity: 0.88 }
            }}
          >
            {thumbnailSrc ? (
              <Thumbnail
                url={thumbnailSrc}
                w="100%"
                h="100%"
                alt={primaryText}
                sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <AudioThumbnailFallback size={145} />
            )}
          </Box>
        </Box>

        <Box
          sx={{
            px: 1.25,
            py: 0.5,
            borderRadius: 999,
            backgroundColor: (theme) => alpha(theme.palette.error.main, 0.18),
            color: 'common.white',
            display: 'flex',
            alignItems: 'center',
            gap: 0.75
          }}
        >
          {visualizerVisible ? (
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: 'error.main',
                boxShadow: (theme) => `0 0 6px 2px ${alpha(theme.palette.error.main, 0.7)}`,
                animation: `${pulseGlow} 1.2s ease-in-out infinite`
              }}
            />
          ) : null}
          <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.08em' }}>
            {upperFileExtension ? `AUDIO · ${upperFileExtension}` : 'AUDIO'}
          </Typography>
        </Box>

        <Box sx={{ minWidth: 0, width: '100%' }}>
          <Typography
            title={primaryText}
            sx={{
              color: 'common.white',
              fontSize: { xs: '1.05rem', sm: '1.25rem' },
              fontWeight: 700,
              letterSpacing: '-0.02em',
              wordBreak: 'break-word',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {primaryText}
          </Typography>
          {secondaryText ? (
            <Typography
              title={secondaryText}
              sx={{
                mt: 0.5,
                color: (theme) => alpha(theme.palette.common.white, 0.6),
                fontSize: '0.82rem',
                fontWeight: 500,
                wordBreak: 'break-word',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {secondaryText}
            </Typography>
          ) : null}
        </Box>
      </Box>
    </Box>
  )
}

function PlayerVideoSurface({
  videoRef,
  src,
  isAudioFile,
  videoObjectFit,
  onError,
  onLoadedMetadata,
  onCanPlay,
  onPlay,
  onPause,
  onSeeked,
  onTimeUpdate,
  onClick,
  onDoubleClick
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>
  src: string
  isAudioFile: boolean
  videoObjectFit: string
  onError: (event: React.SyntheticEvent<HTMLVideoElement>) => void
  onLoadedMetadata: () => void
  onCanPlay: () => void
  onPlay: () => void
  onPause: () => void
  onSeeked: () => void
  onTimeUpdate: () => void
  onClick: () => void
  onDoubleClick: () => void
}): React.JSX.Element {
  return (
    <Box
      component="video"
      ref={videoRef}
      src={src}
      onError={onError}
      onLoadedMetadata={onLoadedMetadata}
      onCanPlay={onCanPlay}
      onPlay={onPlay}
      onPause={onPause}
      onSeeked={onSeeked}
      onTimeUpdate={onTimeUpdate}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      autoPlay
      preload="metadata"
      sx={{
        display: 'block',
        position: 'absolute',
        inset: 0,
        width: isAudioFile ? 1 : '100%',
        height: isAudioFile ? 1 : '100%',
        objectFit: videoObjectFit,
        objectPosition: 'center',
        backgroundColor: 'common.black',
        WebkitAppRegion: 'no-drag',
        cursor: 'inherit',
        opacity: isAudioFile ? 0 : 1,
        pointerEvents: isAudioFile ? 'none' : 'auto',
        '&::-webkit-media-controls': { display: 'none !important' }
      }}
    />
  )
}

function EmptyPlayerState(): React.JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        color: 'common.white',
        textAlign: 'center',
        px: 3,
        width: '100%',
        height: '100%'
      }}
    >
      <Typography variant="h6">재생할 파일이 없습니다.</Typography>
      <Typography variant="body2" sx={{ color: (theme) => alpha(theme.palette.common.white, 0.5) }}>
        player window를 열 때 src를 전달하도록 연결이 필요합니다.
      </Typography>
    </Box>
  )
}

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
          {isAudioFile ? <PlayerBackgroundLayer thumbnailSrc={thumbnailSrc} /> : null}

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
        <EmptyPlayerState />
      )}
    </Box>
  )
}
