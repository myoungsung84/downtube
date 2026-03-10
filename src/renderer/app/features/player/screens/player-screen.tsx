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
const IcVisualizer = (): React.JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 15h2v4H3zm4-6h2v10H7zm4 3h2v7h-2zm4-8h2v15h-2zm4 5h2v10h-2z" />
  </svg>
)

// ── 최소 진폭 임계값 ──────────────────────────────────────────────────────
const MIN_AMPLITUDE_THRESHOLD = 0.03

function AudioVisualizerOverlay({
  videoRef,
  visible,
  seekbarRef
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>
  visible: boolean
  seekbarRef: React.RefObject<HTMLDivElement | null>
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const sourceElementRef = useRef<HTMLVideoElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const peaksRef = useRef<Float32Array | null>(null)
  const peakHoldRef = useRef<Float32Array | null>(null)
  const hueOffsetRef = useRef<number>(0)
  // 바 페이드아웃: 소리 없을 때 서서히 줄어드는 부드러운 진폭 값
  const smoothedAmplitudeRef = useRef<number>(0)

  const stopDrawLoop = useCallback((): void => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const syncCanvasSize = (): void => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const width = Math.max(1, Math.floor(rect.width * dpr))
      const height = Math.max(1, Math.floor(rect.height * dpr))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
    }

    syncCanvasSize()
    window.addEventListener('resize', syncCanvasSize)
    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => syncCanvasSize()) : null
    observer?.observe(canvas)

    return () => {
      window.removeEventListener('resize', syncCanvasSize)
      observer?.disconnect()
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (!visible) {
      stopDrawLoop()
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      return
    }

    if (!video) return

    if (!audioContextRef.current) {
      audioContextRef.current = new window.AudioContext()
    }
    const audioContext = audioContextRef.current
    void audioContext.resume().catch(() => undefined)

    if (!analyserRef.current) {
      const analyser = audioContext.createAnalyser()
      // fftSize 높여서 주파수 해상도 향상
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.8
      analyser.connect(audioContext.destination)
      analyserRef.current = analyser
      const binCount = analyser.frequencyBinCount
      dataArrayRef.current = new Uint8Array(new ArrayBuffer(binCount))
      peaksRef.current = new Float32Array(120)
      peakHoldRef.current = new Float32Array(120)
    }

    if (!sourceRef.current || sourceElementRef.current !== video) {
      try {
        sourceRef.current?.disconnect()
        sourceRef.current = audioContext.createMediaElementSource(video)
        sourceRef.current.connect(analyserRef.current)
        sourceElementRef.current = video
      } catch {
        return
      }
    }

    const analyser = analyserRef.current
    const dataArray = dataArrayRef.current
    const peaks = peaksRef.current
    const peakHold = peakHoldRef.current
    if (!analyser || !dataArray || !peaks || !peakHold) return

    const BAR_COUNT = 120

    // ── 멜 스케일 주파수 빈 매핑: 저주파~고주파 고르게 분포 ──────────────
    // sampleRate 기반으로 nyquist 주파수까지 사용
    const buildMelBins = (binCount: number, sampleRate: number): number[] => {
      // 사용할 주파수 범위: 20Hz ~ 16000Hz (가청 범위 커버)
      const fMin = 20
      const fMax = Math.min(16000, (sampleRate / 2) * 0.95)
      const nyquist = sampleRate / 2
      const hzPerBin = nyquist / binCount

      // 멜 스케일 변환
      const melMin = 2595 * Math.log10(1 + fMin / 700)
      const melMax = 2595 * Math.log10(1 + fMax / 700)

      const bins: number[] = []
      for (let i = 0; i < BAR_COUNT; i++) {
        const mel = melMin + (melMax - melMin) * (i / (BAR_COUNT - 1))
        const hz = 700 * (Math.pow(10, mel / 2595) - 1)
        const bin = Math.round(hz / hzPerBin)
        bins.push(Math.min(bin, binCount - 1))
      }
      return bins
    }

    const draw = (): void => {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      analyser.getByteFrequencyData(dataArray)
      hueOffsetRef.current = (hueOffsetRef.current + 0.12) % 360

      const dpr = window.devicePixelRatio || 1
      const DRAW_W = w

      // centerY: 시크바 DOM Y 위치 기준
      let centerY = h - Math.floor(h * 0.135)
      const seekEl = seekbarRef.current
      if (seekEl) {
        const canvasRect = canvas.getBoundingClientRect()
        const seekRect = seekEl.getBoundingClientRect()
        const seekCenterY = seekRect.top + seekRect.height / 2 - canvasRect.top
        centerY = Math.round(seekCenterY * dpr)
      }

      const GAP = 1
      const barW = Math.floor((DRAW_W - GAP * (BAR_COUNT - 1)) / BAR_COUNT)
      const barStartX = 0

      // 바 높이를 더 역동적으로: 화면 높이의 46%까지
      const MAX_H = Math.floor(h * 0.46)
      const MAX_REFLECT = Math.floor(h * 0.1)
      const RADIUS = Math.max(1, Math.floor(barW / 2))

      // 전체 평균 진폭 계산
      let totalEnergy = 0
      for (let i = 0; i < dataArray.length; i++) {
        totalEnergy += dataArray[i]
      }
      const avgAmplitude = totalEnergy / (dataArray.length * 255)

      // smoothedAmplitude: 소리 있을 때 빠르게 반응, 없을 때 천천히 감소
      const prevSmoothed = smoothedAmplitudeRef.current
      if (avgAmplitude > prevSmoothed) {
        smoothedAmplitudeRef.current = avgAmplitude * 0.6 + prevSmoothed * 0.4
      } else {
        // 페이드아웃: 천천히 감소 (약 1.5초에 걸쳐 0으로)
        smoothedAmplitudeRef.current = prevSmoothed * 0.97
      }
      const smoothedAmp = smoothedAmplitudeRef.current
      const hasAudibleEnergy = smoothedAmp > MIN_AMPLITUDE_THRESHOLD
      const amplitudeFloor = hasAudibleEnergy ? 0.01 : 0

      // 완전히 0에 가까우면 그리지 않음
      if (smoothedAmp < 0.001) {
        peaks.fill(0)
        peakHold.fill(0)
        animationFrameRef.current = requestAnimationFrame(draw)
        return
      }

      // 전체 페이드 계수: 소리가 줄어들면 바 전체도 서서히 줄어듦
      const fadeScale = Math.min(
        1,
        smoothedAmp / Math.max(MIN_AMPLITUDE_THRESHOLD, avgAmplitude * 0.5 + 0.01)
      )
      const getShapedVisualizerValue = (raw: number, scale: number): number => {
        const normalizedRaw = Math.max(0, Math.min(1, raw))
        const curved = Math.pow(normalizedRaw, 0.9)
        const boosted = curved + Math.max(0, curved - 0.3) * 0.42
        return Math.min(1, boosted) * scale
      }

      // 멜 스케일 빈 인덱스 계산
      // AudioContext sampleRate: 보통 44100 또는 48000
      const sampleRate = audioContext.sampleRate
      const melBins = buildMelBins(dataArray.length, sampleRate)

      // ── 반사 먼저 ──────────────────────────────────────────────────────────
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, centerY + 1, DRAW_W, MAX_REFLECT)
      ctx.clip()

      for (let i = 0; i < BAR_COUNT; i++) {
        // 멜 스케일 빈으로 값 읽기 (인접 빈 평균으로 스무딩)
        const binIdx = melBins[i]
        const binPrev = i > 0 ? melBins[i - 1] : binIdx
        const binNext = i < BAR_COUNT - 1 ? melBins[i + 1] : binIdx

        let sum = 0
        let count = 0
        for (let b = binPrev; b <= binNext; b++) {
          sum += dataArray[Math.min(b, dataArray.length - 1)]
          count++
        }
        const rawVal = sum / count / 255
        const val = getShapedVisualizerValue(rawVal, fadeScale)
        const visibleVal = hasAudibleEnergy ? Math.max(val, amplitudeFloor) : val

        if (visibleVal < 0.005) continue

        const x = barStartX + i * (barW + GAP)
        const barH = Math.max(2, Math.floor(MAX_H * visibleVal))
        const hue = (hueOffsetRef.current + (i / BAR_COUNT) * 200) % 360
        const reflectH = Math.min(barH * 0.72, MAX_REFLECT)

        const gradDown = ctx.createLinearGradient(x, centerY, x, centerY + reflectH)
        gradDown.addColorStop(0, `hsla(${hue},70%,60%,${0.1 + visibleVal * 0.08})`)
        gradDown.addColorStop(0.3, `hsla(${hue},65%,55%,${0.06 + visibleVal * 0.05})`)
        gradDown.addColorStop(0.65, `hsla(${hue},60%,50%,${0.02 + visibleVal * 0.02})`)
        gradDown.addColorStop(1, 'rgba(0,0,0,0)')

        ctx.fillStyle = gradDown
        ctx.beginPath()
        if (ctx.roundRect) {
          ctx.roundRect(x, centerY + 1, barW, reflectH, [0, 0, RADIUS, RADIUS])
        } else {
          ctx.rect(x, centerY + 1, barW, reflectH)
        }
        ctx.fill()
      }

      ctx.restore()

      // ── 메인 바 ──────────────────────────────────────────────────────────
      for (let i = 0; i < BAR_COUNT; i++) {
        const binIdx = melBins[i]
        const binPrev = i > 0 ? melBins[i - 1] : binIdx
        const binNext = i < BAR_COUNT - 1 ? melBins[i + 1] : binIdx

        let sum = 0
        let count = 0
        for (let b = binPrev; b <= binNext; b++) {
          sum += dataArray[Math.min(b, dataArray.length - 1)]
          count++
        }
        const val = getShapedVisualizerValue(sum / count / 255, fadeScale)
        const visibleVal = hasAudibleEnergy ? Math.max(val, amplitudeFloor) : val

        if (!hasAudibleEnergy && visibleVal < 0.005) {
          peaks[i] = 0
          peakHold[i] = 0
          continue
        }

        const x = barStartX + i * (barW + GAP)
        const barH = Math.max(2, Math.floor(MAX_H * visibleVal))

        const hue = (hueOffsetRef.current + (i / BAR_COUNT) * 200) % 360
        const hueTop = hue
        const hueMid = (hue + 20) % 360
        const hueBot = (hue + 40) % 360

        const sat = 65 + visibleVal * 20
        const litTop = 78 + visibleVal * 14
        const litMid = 58 + visibleVal * 10
        const litBot = 40 + visibleVal * 8

        const aTop = 0.52 + visibleVal * 0.28
        const aMid = 0.38 + visibleVal * 0.22
        const aBot = 0.15 + visibleVal * 0.14

        // 피크 홀드
        if (barH > peaks[i]) {
          peaks[i] = barH
          peakHold[i] = 32
        } else {
          if (peakHold[i] > 0) {
            peakHold[i] -= 1
          } else {
            peaks[i] = Math.max(0, peaks[i] * 0.92)
          }
        }

        // 소프트 글로우 — 임계값 낮추고 강도 강화
        if (visibleVal > 0.15) {
          ctx.save()
          ctx.shadowColor = `hsla(${hueTop},${sat}%,70%,${visibleVal * 0.55})`
          ctx.shadowBlur = Math.floor(6 + visibleVal * 18)
          ctx.fillStyle = `hsla(${hueTop},${sat}%,65%,${visibleVal * 0.06})`
          ctx.fillRect(x - 1, centerY - barH - 2, barW + 2, barH + 3)
          ctx.restore()
        }

        // 메인 바 그라디언트 — 4단계 색상 스톱으로 세밀화
        const hueQ = (hue + 30) % 360
        const gradUp = ctx.createLinearGradient(x, centerY - barH, x, centerY)
        gradUp.addColorStop(0, `hsla(${hueTop},${sat}%,${litTop}%,${aTop})`)
        gradUp.addColorStop(0.25, `hsla(${hueQ},${sat - 5}%,${litTop - 6}%,${aTop * 0.88})`)
        gradUp.addColorStop(0.55, `hsla(${hueMid},${sat}%,${litMid}%,${aMid})`)
        gradUp.addColorStop(1, `hsla(${hueBot},${sat}%,${litBot}%,${aBot})`)

        ctx.fillStyle = gradUp
        ctx.beginPath()
        if (ctx.roundRect) {
          ctx.roundRect(x, centerY - barH, barW, barH, [RADIUS, RADIUS, 0, 0])
        } else {
          ctx.rect(x, centerY - barH, barW, barH)
        }
        ctx.fill()

        // 상단 하이라이트 — 기준 낮춰 더 자주 표시
        if (visibleVal > 0.18) {
          const hlH = Math.max(2, Math.floor(barH * 0.22))
          const gradHL = ctx.createLinearGradient(x, centerY - barH, x, centerY - barH + hlH)
          gradHL.addColorStop(0, `rgba(255,255,255,${visibleVal * 0.38})`)
          gradHL.addColorStop(0.5, `rgba(255,255,255,${visibleVal * 0.12})`)
          gradHL.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.fillStyle = gradHL
          ctx.beginPath()
          if (ctx.roundRect) {
            ctx.roundRect(x, centerY - barH, barW, hlH, [RADIUS, RADIUS, 0, 0])
          } else {
            ctx.rect(x, centerY - barH, barW, hlH)
          }
          ctx.fill()
        }

        // 바 테두리 엣지 라이트 (좌측 밝은 선)
        if (visibleVal > 0.25 && barW >= 3) {
          const edgeGrad = ctx.createLinearGradient(x, centerY - barH, x, centerY)
          edgeGrad.addColorStop(0, `hsla(${hueTop},90%,92%,${visibleVal * 0.45})`)
          edgeGrad.addColorStop(0.6, `hsla(${hueTop},80%,80%,${visibleVal * 0.15})`)
          edgeGrad.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.fillStyle = edgeGrad
          ctx.fillRect(x, centerY - barH, 1, barH)
        }

        // 피크 마커 — 더 얇고 선명하게
        const peakH = Math.floor(peaks[i])
        if (peakH > 4) {
          const isHolding = peakHold[i] > 0
          const peakAlpha = isHolding ? 0.95 : 0.34

          if (isHolding) {
            ctx.save()
            ctx.shadowColor = `hsla(${hueTop},90%,85%,0.8)`
            ctx.shadowBlur = 7
          }

          ctx.fillStyle = `hsla(${(hueTop + 40) % 360},90%,90%,${peakAlpha})`
          ctx.beginPath()
          if (ctx.roundRect) {
            ctx.roundRect(x, centerY - peakH - 2, barW, 1.5, 1)
          } else {
            ctx.rect(x, centerY - peakH - 2, barW, 1.5)
          }
          ctx.fill()

          if (isHolding) ctx.restore()
        }
      }

      animationFrameRef.current = requestAnimationFrame(draw)
    }

    if (animationFrameRef.current === null) {
      draw()
    }

    return () => {
      stopDrawLoop()
    }
  }, [stopDrawLoop, videoRef, visible, seekbarRef])

  useEffect(
    () => () => {
      stopDrawLoop()
      sourceRef.current?.disconnect()
      analyserRef.current?.disconnect()
      void audioContextRef.current?.close()
    },
    [stopDrawLoop]
  )

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.35s ease',
        zIndex: 2
      }}
    >
      <Box
        component="canvas"
        ref={canvasRef}
        sx={{ width: '100%', height: '100%', display: 'block' }}
      />
    </Box>
  )
}

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
  // uiVisible: 중앙 재생버튼 완전 숨김 여부
  const [uiVisible, setUiVisible] = useState(true)
  const [seeking, setSeeking] = useState(false)
  const [seekValue, setSeekValue] = useState(0)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [hoverX, setHoverX] = useState(0)
  const [visualizerVisible, setVisualizerVisible] = useState(false)
  const [mediaMeta, setMediaMeta] = useState<{ title?: string; artist?: string }>({})
  const seekbarRef = useRef<HTMLDivElement | null>(null)

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

  const fileExtension = useMemo(() => {
    if (!fileName.includes('.')) return ''
    return fileName.split('.').pop()?.toUpperCase() ?? ''
  }, [fileName])

  const fileNameWithoutExt = useMemo(() => {
    if (!fileName.includes('.')) return fileName
    return fileName.slice(0, fileName.lastIndexOf('.'))
  }, [fileName])

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

  // ── 로직 함수들 ───────────────────────────────────────────────────────────
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
    const video = videoRef.current
    if (!video) return
    console.log(`[player] ${label}`, { currentTime: video.currentTime, paused: video.paused })
  }

  // ── 컨트롤 핸들러 ─────────────────────────────────────────────────────────
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
      setSeekValue(v)
      if (!video) {
        setSeeking(false)
        return
      }
      video.currentTime = v
    },
    []
  )

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    document.fullscreenElement ? void document.exitFullscreen() : void el.requestFullscreen()
  }, [])

  // ── UI 자동 숨김 ──────────────────────────────────────────────────────────
  // uiVisible: true = 완전히 보임, false = 중앙만 숨김 (상하단은 희미하게 유지)
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

  const seekSliderSx = {
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
        // 커서: 완전히 숨김은 중앙만 숨길 때도 유지
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
          <AudioVisualizerOverlay
            videoRef={videoRef}
            visible={visualizerVisible}
            seekbarRef={seekbarRef}
          />

          {/* ══════════════════════════════════════════
              상단/하단 오버레이 — 항상 희미하게 표시
              uiVisible=true 일 때 완전히 표시
          ══════════════════════════════════════════ */}

          {/* ── 상단 그라디언트 배경 (항상) ── */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 120,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, transparent 100%)',
              pointerEvents: 'none',
              zIndex: 3
            }}
          />

          {/* ── 하단 그라디언트 배경 (항상) ── */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 160,
              background:
                'linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.55) 60%, transparent 100%)',
              pointerEvents: 'none',
              zIndex: 3
            }}
          />

          {/* ── 좌측 상단: 파일명 — 숨길 때 반투명(0.28) ── */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              pointerEvents: uiVisible ? 'auto' : 'none',
              opacity: uiVisible ? 1 : 0.28,
              transition: 'opacity 0.5s ease',
              zIndex: 4
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 18,
                left: 20,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                pointerEvents: uiVisible ? 'auto' : 'none',
                maxWidth: '55%'
              }}
            >
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
              <Typography
                title={displayFileName}
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
                {displayFileName || '알 수 없는 파일'}
              </Typography>
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
          </Box>

          {/* ── 우측 상단: 시각화 모드에서만 숨김 시 반투명 ── */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              pointerEvents: uiVisible ? 'auto' : 'none',
              opacity: uiVisible ? 1 : visualizerVisible ? 0.28 : 0,
              transition: 'opacity 0.5s ease',
              zIndex: 4
            }}
          >
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              sx={{
                position: 'absolute',
                top: 20,
                right: 20,
                pointerEvents: uiVisible ? 'auto' : 'none'
              }}
            >
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
          </Box>

          {/* ──────────────────────────────────────────
              중앙 재생 컨트롤 — uiVisible 아닐 때 완전히 사라짐
          ────────────────────────────────────────── */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              pointerEvents: uiVisible ? 'auto' : 'none',
              opacity: uiVisible ? 1 : 0,
              transition: 'opacity 0.4s ease',
              zIndex: 4
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

            {/* 재생 / 정지 */}
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

          {/* ── 시크바: 시각화 모드에서만 표시 ── */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 44,
              left: 0,
              right: 0,
              px: 0,
              pointerEvents: uiVisible ? 'auto' : 'none',
              opacity: uiVisible ? 1 : visualizerVisible ? 0.42 : 0,
              transition: 'opacity 0.5s ease',
              zIndex: 4
            }}
          >
            <Box
              ref={seekbarRef}
              sx={{ position: 'relative', mx: 0 }}
              onMouseMove={handleSeekbarMouseMove}
              onMouseLeave={handleSeekbarMouseLeave}
            >
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
          </Box>

          {/* ── 컨트롤 버튼 행: 시각화 모드에서만 숨김 시 반투명 ── */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              pb: 1.5,
              pointerEvents: uiVisible ? 'auto' : 'none',
              opacity: uiVisible ? 1 : visualizerVisible ? 0.28 : 0,
              transition: 'opacity 0.5s ease',
              zIndex: 4
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ px: 2 }}
            >
              <Stack direction="row" alignItems="center">
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
                <Box
                  sx={{
                    width: '1px',
                    height: 14,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    mx: '18px',
                    flexShrink: 0
                  }}
                />
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
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Btn
                  onClick={() => setVisualizerVisible((prev) => !prev)}
                  title="음성 시각화"
                  size="sm"
                >
                  <Box
                    sx={{
                      display: 'flex',
                      color: visualizerVisible ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.65)'
                    }}
                  >
                    <IcVisualizer />
                  </Box>
                </Btn>
                <Btn onClick={toggleFullscreen} title="전체화면 (F)" size="sm">
                  {isFullscreen ? <IcExitFullscreen /> : <IcFullscreen />}
                </Btn>
              </Stack>
            </Stack>
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
