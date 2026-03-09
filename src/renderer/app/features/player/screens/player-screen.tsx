import { Box, Slider, Stack, Typography } from '@mui/material'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// ── SVG 아이콘 ──────────────────────────────────────────────────────────────
const IcPlay = (): React.JSX.Element => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
)
const IcPause = (): React.JSX.Element => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
)
const IcReplay10 = (): React.JSX.Element => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8zm-1.1 11H10v-3.26L9 13v-.75l1.85-.65h.05V16zm2.86-.63c-.18.26-.49.4-.93.4s-.75-.13-.93-.4c-.18-.26-.28-.65-.28-1.17v-.69c0-.52.09-.91.28-1.17.18-.26.49-.4.93-.4s.75.13.93.4c.18.26.27.65.27 1.17v.69c0 .52-.09.91-.27 1.17zm-.28-1.86c0-.31-.03-.54-.1-.69-.06-.15-.17-.23-.32-.23s-.26.08-.32.23c-.07.15-.1.38-.1.69v.73c0 .31.03.55.1.7.06.15.17.23.32.23s.26-.08.32-.23c.07-.15.1-.39.1-.7v-.73z" />
  </svg>
)
const IcForward10 = (): React.JSX.Element => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6v4l5-5-5-5v4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8h-2zm-5.1 3H12v-3.26L11 13v-.75l1.85-.65h.05V16zm2.86-.63c-.18.26-.49.4-.93.4s-.75-.13-.93-.4c-.18-.26-.28-.65-.28-1.17v-.69c0-.52.09-.91.28-1.17.18-.26.49-.4.93-.4s.75.13.93.4c.18.26.27.65.27 1.17v.69c0 .52-.09.91-.27 1.17zm-.28-1.86c0-.31-.03-.54-.1-.69-.06-.15-.17-.23-.32-.23s-.26.08-.32.23c-.07.15-.1.38-.1.69v.73c0 .31.03.55.1.7.06.15.17.23.32.23s.26-.08.32-.23c.07-.15.1-.39.1-.7v-.73z" />
  </svg>
)
const IcVolumeHigh = (): React.JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
)
const IcVolumeMute = (): React.JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
)
const IcFullscreen = (): React.JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
  </svg>
)
const IcExitFullscreen = (): React.JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
  </svg>
)
const IcFolder = (): React.JSX.Element => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
  </svg>
)

// ── 아이콘 버튼 ─────────────────────────────────────────────────────────────
const Btn = ({
  onClick,
  title,
  children,
  size = 'md'
}: {
  onClick: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}): React.JSX.Element => {
  const pad = size === 'lg' ? '14px' : size === 'sm' ? '6px' : '9px'
  return (
    <Box
      component="button"
      onClick={onClick}
      title={title}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        p: pad,
        borderRadius: '50%',
        transition: 'background 0.15s, transform 0.1s',
        flexShrink: 0,
        '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)', transform: 'scale(1.08)' },
        '&:active': { backgroundColor: 'rgba(255,255,255,0.22)', transform: 'scale(0.95)' }
      }}
    >
      {children}
    </Box>
  )
}

// ── 메인 컴포넌트 ───────────────────────────────────────────────────────────
export default function PlayerScreen(): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // ── URL 파싱 ──────────────────────────────────────────────────────────────
  const hash = window.location.hash
  const searchParams = new URLSearchParams(hash.split('?')[1] || '')
  const rawVideoSrc = searchParams.get('src') ?? ''
  const videoSrc = useMemo(() => {
    if (!rawVideoSrc) return ''
    try {
      return decodeURIComponent(rawVideoSrc)
    } catch {
      return rawVideoSrc
    }
  }, [rawVideoSrc])

  const fileName = useMemo(() => {
    if (!videoSrc) return ''
    try {
      const url = new URL(videoSrc)
      const path = url.searchParams.get('path') ?? ''
      if (!path) return ''
      const decodedPath = decodeURIComponent(path)
      const segments = decodedPath.split('/').filter(Boolean)
      return segments[segments.length - 1] ?? ''
    } catch {
      return ''
    }
  }, [videoSrc])

  const mediaPath = useMemo(() => {
    if (!videoSrc) return ''
    try {
      const url = new URL(videoSrc)
      const path = url.searchParams.get('path') ?? ''
      return path ? decodeURIComponent(path) : ''
    } catch {
      return ''
    }
  }, [videoSrc])

  const folderPath = useMemo(() => {
    if (!mediaPath) return ''
    const normalized = mediaPath.replace(/\\/g, '/')
    const lastSlashIndex = normalized.lastIndexOf('/')
    if (lastSlashIndex <= 0) return normalized
    return normalized.slice(0, lastSlashIndex)
  }, [mediaPath])

  const fileExtension = useMemo(() => {
    if (!fileName.includes('.')) return ''
    return fileName.split('.').pop()?.toUpperCase() ?? ''
  }, [fileName])

  const fileNameWithoutExt = useMemo(() => {
    if (!fileName.includes('.')) return fileName
    return fileName.slice(0, fileName.lastIndexOf('.'))
  }, [fileName])

  const videoObjectFit = useMemo(() => {
    if (meta.width <= 0 || meta.height <= 0) return 'contain'
    return meta.width >= meta.height ? 'cover' : 'contain'
  }, [meta.height, meta.width])

  const formatSeconds = (seconds: number): string => {
    if (!Number.isFinite(seconds) || seconds < 0) return '00:00'
    const totalSeconds = Math.floor(seconds)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const remainSeconds = totalSeconds % 60
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainSeconds).padStart(2, '0')}`
    }
    return `${String(minutes).padStart(2, '0')}:${String(remainSeconds).padStart(2, '0')}`
  }

  // ── 로직 함수들 ──────────────────────────────────────────────────────────
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
    const bw = window as Window & {
      downtube?: {
        showItemInFolder?: (p: string) => Promise<void> | void
        openFolder?: (p: string) => Promise<void> | void
      }
      electronAPI?: {
        showItemInFolder?: (p: string) => Promise<void> | void
        openFolder?: (p: string) => Promise<void> | void
      }
      api?: {
        showItemInFolder?: (p: string) => Promise<void> | void
        openFolder?: (p: string) => Promise<void> | void
      }
    }
    const showItemInFolder =
      bw.downtube?.showItemInFolder ?? bw.electronAPI?.showItemInFolder ?? bw.api?.showItemInFolder
    const openFolder = bw.downtube?.openFolder ?? bw.electronAPI?.openFolder ?? bw.api?.openFolder
    if (showItemInFolder) {
      await showItemInFolder(mediaPath)
      return
    }
    if (openFolder && folderPath) {
      await openFolder(folderPath)
      return
    }
    if (navigator.clipboard && folderPath) await navigator.clipboard.writeText(folderPath)
  }

  const logVideoState = (label: string): void => {
    const video = videoRef.current
    if (!video) return
    console.log(`[player] ${label}`, { currentTime: video.currentTime, paused: video.paused })
  }

  // ── 컨트롤 핸들러 ────────────────────────────────────────────────────────
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

  const handleVolumeChange = useCallback((_: Event, val: number | number[]) => {
    const v = Array.isArray(val) ? val[0] : val
    const video = videoRef.current
    if (!video) return
    video.volume = v
    video.muted = v === 0
    setVolume(v)
    setMuted(v === 0)
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }, [])

  const handleSeekChange = useCallback((_: Event, val: number | number[]) => {
    const v = Array.isArray(val) ? val[0] : val
    setSeekValue(v)
    setSeeking(true)
  }, [])

  const handleSeekCommit = useCallback(
    (_: React.SyntheticEvent | Event, val: number | number[]) => {
      const v = Array.isArray(val) ? val[0] : val
      const video = videoRef.current
      if (video) video.currentTime = v
      setSeeking(false)
    },
    []
  )

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    document.fullscreenElement ? void document.exitFullscreen() : void el.requestFullscreen()
  }, [])

  // ── UI 자동 숨김 ─────────────────────────────────────────────────────────
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

  // 시크바 hover 타임
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

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    setMeta({ fileName, duration: 0, width: 0, height: 0, currentTime: 0 })
    setSeekValue(0)
  }, [fileName, videoSrc])

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

  // ── 공통 오버레이 슬라이더 스타일 ────────────────────────────────────────
  const seekSliderSx = {
    color: '#e53935',
    height: 4,
    padding: '10px 0',
    '& .MuiSlider-thumb': {
      width: 14,
      height: 14,
      backgroundColor: '#fff',
      boxShadow: '0 0 0 2px rgba(229,57,53,0.5)',
      transition: 'box-shadow 0.15s',
      '&:before': { display: 'none' },
      '&:hover, &.Mui-focusVisible': { boxShadow: '0 0 0 8px rgba(229,57,53,0.25)' }
    },
    '& .MuiSlider-rail': { backgroundColor: 'rgba(255,255,255,0.2)', opacity: 1 },
    '& .MuiSlider-track': { border: 'none' }
  }

  const volSliderSx = {
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
          {/* ── VIDEO ── */}
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
            onSeeked={() => logVideoState('seeked')}
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

          {/* ══════════════════════════════════════════
              오버레이 전체 — pointer-events 없음
              (자식들만 개별적으로 켜짐)
          ══════════════════════════════════════════ */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              opacity: uiVisible ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
          >
            {/* ── 상단 그라디언트 ── */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 120,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)',
                pointerEvents: 'none'
              }}
            />

            {/* ── 하단 그라디언트 ── */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 160,
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
                pointerEvents: 'none'
              }}
            />

            {/* ────────────────────────────────────────
                좌측 상단: EXT 뱃지 + 파일명 + 폴더버튼
            ──────────────────────────────────────── */}
            <Box
              sx={{
                position: 'absolute',
                top: 18,
                left: 20,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                pointerEvents: 'auto',
                maxWidth: '55%'
              }}
            >
              {/* EXT 뱃지 */}
              {fileExtension && (
                <Box
                  sx={{
                    flexShrink: 0,
                    px: '8px',
                    py: '3px',
                    borderRadius: '5px',
                    backgroundColor: '#e53935',
                    lineHeight: 1
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.6rem',
                      fontWeight: 900,
                      letterSpacing: '0.08em',
                      color: '#fff',
                      textTransform: 'uppercase',
                      lineHeight: 1.5
                    }}
                  >
                    {fileExtension}
                  </Typography>
                </Box>
              )}

              {/* 파일명 */}
              <Typography
                title={fileNameWithoutExt}
                sx={{
                  color: 'rgba(255,255,255,0.92)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  letterSpacing: '-0.01em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textShadow: '0 1px 6px rgba(0,0,0,0.8)'
                }}
              >
                {fileNameWithoutExt || '알 수 없는 파일'}
              </Typography>

              {/* 폴더 버튼 */}
              <Box
                component="button"
                onClick={handleOpenFolder}
                title="폴더 열기"
                sx={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(6px)',
                  color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  px: '10px',
                  py: '5px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  transition: 'background 0.15s, color 0.15s',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.14)', color: '#fff' }
                }}
              >
                <IcFolder />
                폴더
              </Box>
            </Box>

            {/* ────────────────────────────────────────
                우측 상단: 해상도 + 배속 버튼 나열
            ──────────────────────────────────────── */}
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              sx={{
                position: 'absolute',
                top: 20,
                right: 20,
                pointerEvents: 'auto'
              }}
            >
              {/* 해상도 칩 */}
              {meta.width > 0 && meta.height > 0 && (
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    height: 24,
                    px: '10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(6px)',
                    mr: 0.5
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.6)',
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1
                    }}
                  >
                    {meta.width} × {meta.height}
                  </Typography>
                </Box>
              )}

              {/* 배속 버튼 목록 나열 */}
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => {
                const isActive = playbackRate === rate
                return (
                  <Box
                    key={rate}
                    component="button"
                    onClick={() => {
                      const video = videoRef.current
                      if (video) video.playbackRate = rate
                      setPlaybackRate(rate)
                    }}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 24,
                      px: '9px',
                      borderRadius: '6px',
                      background: isActive ? 'rgba(229,57,53,0.5)' : 'rgba(255,255,255,0.07)',
                      border: `1px solid ${isActive ? 'rgba(229,57,53,0.7)' : 'rgba(255,255,255,0.1)'}`,
                      backdropFilter: 'blur(6px)',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer',
                      fontSize: '0.68rem',
                      fontWeight: isActive ? 800 : 600,
                      letterSpacing: '0.01em',
                      whiteSpace: 'nowrap',
                      transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                      '&:hover': {
                        backgroundColor: isActive
                          ? 'rgba(229,57,53,0.65)'
                          : 'rgba(255,255,255,0.13)',
                        color: '#fff'
                      }
                    }}
                  >
                    {rate === 1 ? '1×' : `${rate}×`}
                  </Box>
                )
              })}
            </Stack>

            {/* ────────────────────────────────────────
                중앙: 재생 컨트롤 (뒤로 / 재생-정지 / 앞으로)
            ──────────────────────────────────────── */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                pointerEvents: 'auto'
              }}
            >
              {/* 뒤로 10초 */}
              <Box
                component="button"
                onClick={() => skip(-10)}
                title="10초 뒤로 (←)"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.28)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                  color: '#fff',
                  cursor: 'pointer',
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  transition: 'background 0.15s, transform 0.1s',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)', transform: 'scale(1.08)' },
                  '&:active': { transform: 'scale(0.94)' }
                }}
              >
                <IcReplay10 />
              </Box>

              {/* 재생 / 정지 — 반투명 */}
              <Box
                component="button"
                onClick={togglePlay}
                title="재생/일시정지 (Space)"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(229,57,53,0.38)',
                  border: '1px solid rgba(229,57,53,0.45)',
                  backdropFilter: 'blur(12px)',
                  color: '#fff',
                  cursor: 'pointer',
                  width: 66,
                  height: 66,
                  borderRadius: '50%',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                  transition: 'background 0.15s, transform 0.1s, box-shadow 0.15s',
                  '&:hover': {
                    backgroundColor: 'rgba(229,57,53,0.6)',
                    transform: 'scale(1.08)',
                    boxShadow: '0 6px 32px rgba(229,57,53,0.35)'
                  },
                  '&:active': { transform: 'scale(0.93)' }
                }}
              >
                {paused ? <IcPlay /> : <IcPause />}
              </Box>

              {/* 앞으로 10초 */}
              <Box
                component="button"
                onClick={() => skip(10)}
                title="10초 앞으로 (→)"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.28)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                  color: '#fff',
                  cursor: 'pointer',
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  transition: 'background 0.15s, transform 0.1s',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)', transform: 'scale(1.08)' },
                  '&:active': { transform: 'scale(0.94)' }
                }}
              >
                <IcForward10 />
              </Box>
            </Box>

            {/* ────────────────────────────────────────
                하단: 시크바 + [볼륨 | 시간] + 전체화면
            ──────────────────────────────────────── */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                px: 2.5,
                pb: 2,
                pt: 1,
                pointerEvents: 'auto'
              }}
            >
              {/* 시크바 영역 */}
              <Box
                sx={{ position: 'relative', mb: 0.5 }}
                onMouseMove={handleSeekbarMouseMove}
                onMouseLeave={handleSeekbarMouseLeave}
              >
                {/* hover 타임 툴팁 */}
                {hoverTime !== null && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: hoverX,
                      transform: 'translateX(-50%)',
                      backgroundColor: 'rgba(0,0,0,0.82)',
                      color: '#fff',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      px: 1,
                      py: 0.35,
                      borderRadius: '5px',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      fontVariantNumeric: 'tabular-nums',
                      zIndex: 10,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                    }}
                  >
                    {formatSeconds(hoverTime)}
                  </Box>
                )}

                <Slider
                  min={0}
                  max={meta.duration || 100}
                  step={0.1}
                  value={currentSeekVal}
                  onChange={handleSeekChange}
                  onChangeCommitted={handleSeekCommit}
                  sx={seekSliderSx}
                />
              </Box>

              {/* 하단 컨트롤 행 */}
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                {/* 왼쪽: 볼륨 + 구분선 + 시간 */}
                <Stack direction="row" alignItems="center">
                  {/* 볼륨 버튼 + 슬라이더 */}
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Btn onClick={toggleMute} title="음소거 (M)" size="sm">
                      {muted || volume === 0 ? <IcVolumeMute /> : <IcVolumeHigh />}
                    </Btn>
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={muted ? 0 : volume}
                      onChange={handleVolumeChange}
                      sx={volSliderSx}
                    />
                  </Stack>

                  {/* 구분선 */}
                  <Box
                    sx={{
                      width: '1px',
                      height: 14,
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      mx: '18px',
                      flexShrink: 0
                    }}
                  />

                  {/* 시간 */}
                  <Typography
                    sx={{
                      color: 'rgba(255,255,255,0.88)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                      textShadow: '0 1px 4px rgba(0,0,0,0.6)'
                    }}
                  >
                    {formatSeconds(currentSeekVal)}
                    <Box component="span" sx={{ color: 'rgba(255,255,255,0.28)', mx: '6px' }}>
                      /
                    </Box>
                    {formatSeconds(meta.duration)}
                  </Typography>
                </Stack>

                {/* 오른쪽: 전체화면 */}
                <Btn onClick={toggleFullscreen} title="전체화면 (F)" size="sm">
                  {isFullscreen ? <IcExitFullscreen /> : <IcFullscreen />}
                </Btn>
              </Stack>
            </Box>
          </Box>
        </>
      ) : (
        /* ── 파일 없을 때 ── */
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
