import { Box, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
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

const seekSliderSx: SxProps<Theme> = {
  color: '#e53935',
  height: 2,
  padding: '10px 0',
  mx: 0,
  '& .MuiSlider-root': { padding: 0 },
  '& .MuiSlider-thumb': {
    width: 14,
    height: 14,
    backgroundColor: '#fff',
    boxShadow: '0 0 0 2px rgba(229,57,53,0.5)',
    transition: 'box-shadow 0.15s',
    '&:before': { display: 'none' },
    '&:hover, &.Mui-focusVisible': { boxShadow: '0 0 0 8px rgba(229,57,53,0.25)' }
  },
  '& .MuiSlider-rail': {
    backgroundColor: 'rgba(255,255,255,0.25)',
    opacity: 1
  },
  '& .MuiSlider-track': {
    border: 'none',
    backgroundColor: '#e53935',
    opacity: 1
  }
}

const volSliderSx: SxProps<Theme> = {
  color: '#fff',
  height: 3,
  width: 80,
  padding: '10px 0',
  '& .MuiSlider-thumb': {
    width: 13,
    height: 13,
    backgroundColor: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
    '&:before': { display: 'none' },
    '&:hover, &.Mui-focusVisible': { boxShadow: '0 0 0 6px rgba(255,255,255,0.2)' }
  },
  '& .MuiSlider-rail': { backgroundColor: 'rgba(255,255,255,0.25)', opacity: 1 },
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
  const hydrateSettings = useSettingsStore((state) => state.hydrateSettings)
  const getSettingValue = useSettingsStore((state) => state.getValue)
  const setSettingValue = useSettingsStore((state) => state.setValue)

  const [meta, setMeta] = useState<{
    fileName: string
    duration: number
    width: number
    height: number
    currentTime: number
  }>({ fileName: '', duration: 0, width: 0, height: 0, currentTime: 0 })

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
  const [mediaMeta, setMediaMeta] = useState<{ title?: string; artist?: string }>({})
  const storedVolume = getSettingValue(PLAYER_VOLUME_KEY)
  const storedMuted = getSettingValue(PLAYER_MUTED_KEY)
  const storedVisualizerVisible = getSettingValue(PLAYER_VISUALIZER_KEY)

  const hash = window.location.hash

  const searchParams = useMemo(() => getPlayerSearchParamsFromHash(hash), [hash])
  const rawVideoSrc = useMemo(() => searchParams.get('src') ?? '', [searchParams])
  const videoSrc = useMemo(() => getDecodedVideoSrc(rawVideoSrc), [rawVideoSrc])
  const fileName = useMemo(() => getFileNameFromVideoSrc(videoSrc), [videoSrc])
  const mediaPath = useMemo(() => getMediaPathFromVideoSrc(videoSrc), [videoSrc])
  const fileExtension = useMemo(() => getFileExtension(fileName), [fileName])
  const fileNameWithoutExt = useMemo(() => getFileNameWithoutExtension(fileName), [fileName])

  const displayFileName = useMemo(() => {
    if (mediaMeta.title && mediaMeta.artist) return `${mediaMeta.title} - ${mediaMeta.artist}`
    if (mediaMeta.title) return mediaMeta.title
    if (mediaMeta.artist) return mediaMeta.artist
    return fileNameWithoutExt
  }, [fileNameWithoutExt, mediaMeta.artist, mediaMeta.title])

  const videoObjectFit = useMemo(() => {
    if (meta.width <= 0 || meta.height <= 0) return 'contain'
    return meta.width >= meta.height ? 'cover' : 'contain'
  }, [meta.height, meta.width])

  const handleVideoError = (event: React.SyntheticEvent<HTMLVideoElement>): void => {
    console.error('[player] media load error', { src: videoSrc, error: event.currentTarget.error })
  }

  const syncVideoMeta = (): void => {
    const video = videoRef.current
    if (!video) return
    setMeta((prev) => ({
      ...prev,
      fileName,
      duration: Number.isFinite(video.duration) ? video.duration : 0,
      width: video.videoWidth,
      height: video.videoHeight,
      currentTime: video.currentTime
    }))
    setPaused(video.paused)
    if (!seeking) setSeekValue(video.currentTime)
  }

  const handleOpenFolder = async (): Promise<void> => {
    if (!mediaPath) return
    await window.api.openDownloadItem(mediaPath)
  }

  const logVideoState = (label: string): void => {
    if (!import.meta.env.DEV) return
    const video = videoRef.current
    if (!video) return
    console.log(`[player] ${label}`, { currentTime: video.currentTime, paused: video.paused })
  }

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.paused ? void video.play() : video.pause()
  }, [])

  const skip = useCallback((sec: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + sec))
  }, [])

  const handleVolumeChange = useCallback(
    (_: Event, val: number | number[]) => {
      const nextVolume = Array.isArray(val) ? val[0] : val
      const video = videoRef.current
      if (!video) return
      const nextMuted = nextVolume === 0
      video.volume = nextVolume
      video.muted = nextMuted
      setVolume(nextVolume)
      setMuted(nextMuted)
    },
    []
  )

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
    setMuted(nextMuted)
    void setSettingValue(PLAYER_MUTED_KEY, nextMuted)
  }, [setSettingValue])

  const handleSeekChange = useCallback((_: Event, val: number | number[]) => {
    const v = Array.isArray(val) ? val[0] : val
    setSeekValue(v)
    setSeeking(true)
  }, [])

  const handleSeekCommit = useCallback(
    (_: React.SyntheticEvent | Event, val: number | number[]) => {
      const v = Array.isArray(val) ? val[0] : val
      const video = videoRef.current
      setSeekValue(v)
      if (!video) {
        setSeeking(false)
        return
      }
      video.currentTime = v
      setSeeking(false)
    },
    []
  )

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    document.fullscreenElement ? void document.exitFullscreen() : void el.requestFullscreen()
  }, [])

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      const video = videoRef.current
      if (video && !video.paused) setUiVisible(false)
    }, 3000)
  }, [])

  const showUi = useCallback(() => {
    setUiVisible(true)
    scheduleHide()
  }, [scheduleHide])

  const handleSeekbarMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const video = videoRef.current
    if (video && video.duration > 0) {
      setHoverTime(ratio * video.duration)
      setHoverX(e.clientX - rect.left)
    }
  }, [])

  const handleSeekbarMouseLeave = useCallback(() => setHoverTime(null), [])

  useEffect(() => {
    setMeta({ fileName, duration: 0, width: 0, height: 0, currentTime: 0 })
    setSeekValue(0)
  }, [fileName, videoSrc])

  useEffect(() => {
    void hydrateSettings([PLAYER_VOLUME_KEY, PLAYER_MUTED_KEY, PLAYER_VISUALIZER_KEY])
  }, [hydrateSettings])

  useEffect(() => {
    const video = videoRef.current

    if (typeof storedVolume === 'number') {
      setVolume(storedVolume)
      if (video) {
        video.volume = storedVolume
      }
    }

    if (typeof storedMuted === 'boolean') {
      setMuted(storedMuted)
      if (video) {
        video.muted = storedMuted
      }
    }

    if (typeof storedVisualizerVisible === 'boolean') {
      setVisualizerVisible(storedVisualizerVisible)
    }
  }, [storedMuted, storedVisualizerVisible, storedVolume])

  useEffect(() => {
    let mounted = true

    const loadMediaMeta = async (): Promise<void> => {
      if (!mediaPath) {
        if (mounted) setMediaMeta({})
        return
      }

      const result = await window.api.readMediaMeta(mediaPath)
      if (!mounted) return
      if (!result.success) {
        setMediaMeta({})
        return
      }

      setMediaMeta({ title: result.title, artist: result.artist })
    }

    void loadMediaMeta()

    return () => {
      mounted = false
    }
  }, [mediaPath])

  useEffect(() => {
    const onFsChange = (): void => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.target instanceof HTMLInputElement) return
      showUi()
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      }
      if (e.code === 'ArrowLeft') skip(-10)
      if (e.code === 'ArrowRight') skip(10)
      if (e.code === 'KeyF') toggleFullscreen()
      if (e.code === 'KeyM') toggleMute()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePlay, skip, toggleFullscreen, toggleMute, showUi])

  useEffect(() => {
    if (!paused) scheduleHide()
    else {
      if (hideTimer.current) clearTimeout(hideTimer.current)
      setUiVisible(true)
    }
  }, [paused, scheduleHide])

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    },
    []
  )

  const currentSeekVal = seeking ? seekValue : meta.currentTime

  return (
    <Box
      ref={containerRef}
      onMouseMove={showUi}
      onMouseLeave={() => {
        if (!paused) setUiVisible(false)
      }}
      sx={{
        width: '100vw',
        height: '100vh',
        background: '#000',
        overflow: 'hidden',
        position: 'relative',
        WebkitAppRegion: 'no-drag',
        cursor: uiVisible ? 'default' : 'none',
        userSelect: 'none'
      }}
    >
      {videoSrc ? (
        <>
          <Box
            component="video"
            ref={videoRef}
            src={videoSrc}
            onError={handleVideoError}
            onLoadedMetadata={() => {
              syncVideoMeta()
              logVideoState('loadedmetadata')
            }}
            onCanPlay={() => {
              syncVideoMeta()
              logVideoState('canplay')
            }}
            onPlay={() => setPaused(false)}
            onPause={() => setPaused(true)}
            onSeeking={() => logVideoState('seeking')}
            onSeeked={() => {
              syncVideoMeta()
              logVideoState('seeked')
              setSeeking(false)
            }}
            onTimeUpdate={syncVideoMeta}
            onClick={togglePlay}
            onDoubleClick={toggleFullscreen}
            autoPlay
            preload="metadata"
            sx={{
              display: 'block',
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: videoObjectFit,
              objectPosition: 'center',
              backgroundColor: '#000',
              WebkitAppRegion: 'no-drag',
              cursor: 'inherit',
              '&::-webkit-media-controls': { display: 'none !important' }
            }}
          />

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
            meta={{ width: meta.width, height: meta.height, duration: meta.duration }}
            fileExtension={fileExtension}
            displayFileName={displayFileName}
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
              if (video) video.playbackRate = rate
              setPlaybackRate(rate)
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
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            color: '#fff',
            textAlign: 'center',
            px: 3,
            width: '100%',
            height: '100%'
          }}
        >
          <Typography variant="h6">재생할 파일이 없습니다.</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            player window를 열 때 src를 전달하도록 연결이 필요합니다.
          </Typography>
        </Box>
      )}
    </Box>
  )
}
