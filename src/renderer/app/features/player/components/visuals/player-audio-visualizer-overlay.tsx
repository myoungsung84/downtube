import { Box } from '@mui/material'
import React, { useCallback, useEffect, useRef } from 'react'

const MIN_AMPLITUDE_THRESHOLD = 0.03
const LOW_BAND_BIN_COUNT = 36

type PlayerAudioVisualizerOverlayProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>
  visible: boolean
  seekbarRef: React.RefObject<HTMLDivElement | null>
  analysisActive?: boolean
  audioLevelRef?: React.MutableRefObject<number>
}

export default function PlayerAudioVisualizerOverlay({
  videoRef,
  visible,
  seekbarRef,
  analysisActive = visible,
  audioLevelRef
}: PlayerAudioVisualizerOverlayProps): React.JSX.Element {
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
  const smoothedAmplitudeRef = useRef<number>(0)
  const lowBandAmplitudeRef = useRef<number>(0)
  const ambientReactiveLevelRef = useRef<number>(0)
  const melBinsRef = useRef<number[] | null>(null)
  const idleHeightsRef = useRef<Float32Array | null>(null)
  const idleTimeRef = useRef<number>(0)
  const hueSpeedRef = useRef<number>(0.12)
  const canvasOpacityRef = useRef<number>(0)
  // 비네트 펄스
  // 파티클 시스템
  const particlesRef = useRef<
    Array<{
      x: number
      y: number
      vx: number
      vy: number
      life: number // 1 → 0
      maxLife: number
      size: number
      hue: number
    }>
  >([])

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

    if (!visible && !analysisActive) {
      stopDrawLoop()
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      canvasOpacityRef.current = 0
      if (audioLevelRef) {
        audioLevelRef.current = 0
      }
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
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.8
      analyser.connect(audioContext.destination)
      analyserRef.current = analyser
      const binCount = analyser.frequencyBinCount
      dataArrayRef.current = new Uint8Array(new ArrayBuffer(binCount))
      peaksRef.current = new Float32Array(120)
      peakHoldRef.current = new Float32Array(120)
      idleHeightsRef.current = new Float32Array(120)

      const BAR_COUNT_INIT = 120
      const sampleRateInit = audioContext.sampleRate
      const fMin = 20
      const fMax = Math.min(16000, (sampleRateInit / 2) * 0.95)
      const nyquist = sampleRateInit / 2
      const hzPerBin = nyquist / binCount
      const melMin = 2595 * Math.log10(1 + fMin / 700)
      const melMax = 2595 * Math.log10(1 + fMax / 700)
      const bins: number[] = []
      for (let i = 0; i < BAR_COUNT_INIT; i++) {
        const mel = melMin + (melMax - melMin) * (i / (BAR_COUNT_INIT - 1))
        const hz = 700 * (Math.pow(10, mel / 2595) - 1)
        const bin = Math.round(hz / hzPerBin)
        bins.push(Math.min(bin, binCount - 1))
      }
      melBinsRef.current = bins
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

    const draw = (): void => {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      analyser.getByteFrequencyData(dataArray)

      let totalEnergy = 0
      for (let i = 0; i < dataArray.length; i++) {
        totalEnergy += dataArray[i]
      }
      const avgAmplitude = totalEnergy / (dataArray.length * 255)

      let lowBandEnergy = 0
      let lowBandWeight = 0
      for (let i = 0; i < Math.min(LOW_BAND_BIN_COUNT, dataArray.length); i++) {
        const weight = 1 - i / LOW_BAND_BIN_COUNT
        lowBandEnergy += (dataArray[i] / 255) * weight
        lowBandWeight += weight
      }
      const lowBandAmplitude = lowBandWeight > 0 ? lowBandEnergy / lowBandWeight : 0

      const prevSmoothed = smoothedAmplitudeRef.current
      if (avgAmplitude > prevSmoothed) {
        smoothedAmplitudeRef.current = avgAmplitude * 0.6 + prevSmoothed * 0.4
      } else {
        smoothedAmplitudeRef.current = prevSmoothed * 0.97
      }
      const smoothedAmp = smoothedAmplitudeRef.current

      const prevLowBand = lowBandAmplitudeRef.current
      if (lowBandAmplitude > prevLowBand) {
        lowBandAmplitudeRef.current = lowBandAmplitude * 0.7 + prevLowBand * 0.3
      } else {
        lowBandAmplitudeRef.current = prevLowBand * 0.94 + lowBandAmplitude * 0.06
      }
      const lowBandSmoothed = lowBandAmplitudeRef.current

      const ambientTarget = Math.min(1, smoothedAmp * 0.48 + lowBandSmoothed * 1.08)
      const prevAmbientReactive = ambientReactiveLevelRef.current
      if (ambientTarget > prevAmbientReactive) {
        ambientReactiveLevelRef.current = ambientTarget * 0.72 + prevAmbientReactive * 0.28
      } else {
        ambientReactiveLevelRef.current = prevAmbientReactive * 0.86 + ambientTarget * 0.14
      }

      if (audioLevelRef) {
        audioLevelRef.current = ambientReactiveLevelRef.current
      }

      if (!visible) {
        animationFrameRef.current = requestAnimationFrame(draw)
        return
      }

      const dpr = window.devicePixelRatio || 1
      const DRAW_W = w

      let centerY = h - Math.floor(h * 0.135)
      const seekEl = seekbarRef.current
      if (seekEl) {
        const canvasRect = canvas.getBoundingClientRect()
        const seekRect = seekEl.getBoundingClientRect()
        const seekCenterY = seekRect.top + seekRect.height / 2 - canvasRect.top
        centerY = Math.round(seekCenterY * dpr)
      }

      if (!isFinite(centerY) || centerY <= 0) {
        animationFrameRef.current = requestAnimationFrame(draw)
        return
      }

      const GAP = 0
      const MAX_H = Math.floor(h * 0.32)
      const MAX_REFLECT = Math.floor(h * 0.13)
      const RADIUS = Math.max(1, Math.floor((DRAW_W - GAP * (BAR_COUNT - 1)) / BAR_COUNT / 2))

      const hasAudibleEnergy = smoothedAmp > MIN_AMPLITUDE_THRESHOLD
      const amplitudeFloor = hasAudibleEnergy ? 0.01 : 0

      if (smoothedAmp < 0.001) {
        peaks.fill(0)
        peakHold.fill(0)
      }

      const fadeScale = Math.min(
        1,
        smoothedAmp / Math.max(MIN_AMPLITUDE_THRESHOLD, avgAmplitude * 0.5 + 0.01)
      )

      const targetHueSpeed = 0.06 + smoothedAmp * 1.4
      hueSpeedRef.current = hueSpeedRef.current * 0.93 + targetHueSpeed * 0.07
      hueOffsetRef.current = (hueOffsetRef.current + hueSpeedRef.current) % 360

      canvasOpacityRef.current = Math.min(0.6, canvasOpacityRef.current + 0.04)
      ctx.globalAlpha = canvasOpacityRef.current

      // 피라미드 스케일: 가운데=1.0, 양 끝=0.25
      const getPyramidScale = (i: number): number => {
        const t = i / (BAR_COUNT - 1)
        const centered = 1 - Math.abs(t - 0.5) * 2
        return 0.25 + centered * 0.75
      }

      const getShapedVisualizerValue = (
        raw: number,
        scale: number,
        pyramidScale: number
      ): number => {
        const normalizedRaw = Math.max(0, Math.min(1, raw))
        const curved = Math.pow(normalizedRaw, 0.9)
        const boosted = curved + Math.max(0, curved - 0.3) * 0.42
        return Math.min(1, boosted) * scale * pyramidScale
      }

      const getBarGeometry = (i: number): { x: number; barW: number } => {
        const x = Math.round((i / BAR_COUNT) * DRAW_W)
        const nextX = Math.round(((i + 1) / BAR_COUNT) * DRAW_W)
        const barW = Math.max(1, nextX - x - GAP)
        return { x, barW }
      }

      if (!melBinsRef.current) return
      const melBins = melBinsRef.current

      const half = Math.floor(BAR_COUNT / 2)
      const mirroredBins: number[] = new Array(BAR_COUNT)
      for (let i = 0; i < BAR_COUNT; i++) {
        const t =
          i < half ? (half - 1 - i) / Math.max(1, half - 1) : (i - half) / Math.max(1, half - 1)
        const linear = Math.max(0, Math.min(1, t))
        const curved = linear * 0.55 + Math.sqrt(linear) * 0.45
        const melIdx = Math.round(curved * (melBins.length - 1))
        mirroredBins[i] = melBins[Math.max(0, Math.min(melBins.length - 1, melIdx))]
      }

      const readBinAvg = (i: number): number => {
        const binA = mirroredBins[Math.max(0, i - 1)]
        const binB = mirroredBins[i]
        const binC = mirroredBins[Math.min(BAR_COUNT - 1, i + 1)]
        const lo = Math.min(binA, binB, binC)
        const hi = Math.max(binA, binB, binC)
        let sum = 0
        let count = 0
        for (let b = lo; b <= hi; b++) {
          sum += dataArray[Math.min(b, dataArray.length - 1)]
          count++
        }
        return count > 0 ? sum / count / 255 : 0
      }

      const baseBarH = Math.max(5, Math.floor(MAX_H * 0.04))

      // 반사 영역
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, centerY, DRAW_W, Math.max(MAX_REFLECT, h - centerY))
      ctx.clip()

      for (let i = 0; i < BAR_COUNT; i++) {
        const rawVal = readBinAvg(i)
        const pyramidScale = getPyramidScale(i)
        const val = getShapedVisualizerValue(rawVal, fadeScale, pyramidScale)
        const visibleVal = hasAudibleEnergy ? Math.max(val, amplitudeFloor * pyramidScale) : val

        const { x, barW } = getBarGeometry(i)
        const hue = (hueOffsetRef.current + (i / BAR_COUNT) * 200) % 360
        const barH = Math.max(2, Math.floor(MAX_H * visibleVal))
        const reflectH = Math.min(Math.floor(barH * 0.6), MAX_REFLECT)

        if (reflectH < 2) continue

        const aTop = 0.22 + visibleVal * 0.14
        const gradDown = ctx.createLinearGradient(x, centerY, x, centerY + reflectH)
        gradDown.addColorStop(0, `hsla(${hue},72%,68%,${aTop})`)
        gradDown.addColorStop(0.35, `hsla(${hue},68%,62%,${aTop * 0.55})`)
        gradDown.addColorStop(0.7, `hsla(${hue},62%,55%,${aTop * 0.2})`)
        gradDown.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = gradDown
        ctx.beginPath()
        if (ctx.roundRect) {
          ctx.roundRect(x, centerY, barW, reflectH, [0, 0, RADIUS, RADIUS])
        } else {
          ctx.rect(x, centerY, barW, reflectH)
        }
        ctx.fill()

        if (visibleVal > 0.2 && barW >= 3) {
          const edgeGrad = ctx.createLinearGradient(x, centerY, x, centerY + reflectH * 0.6)
          edgeGrad.addColorStop(0, `hsla(${hue},85%,88%,${visibleVal * 0.28})`)
          edgeGrad.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.fillStyle = edgeGrad
          ctx.fillRect(x, centerY, 1, Math.floor(reflectH * 0.6))
        }
      }

      ctx.restore()

      // 베이스 바
      for (let i = 0; i < BAR_COUNT; i++) {
        const { x, barW } = getBarGeometry(i)
        const hue = (hueOffsetRef.current + (i / BAR_COUNT) * 200) % 360
        const baseMainGrad = ctx.createLinearGradient(x, centerY - baseBarH, x, centerY)
        baseMainGrad.addColorStop(0, `hsla(${hue},44%,66%,0.11)`)
        baseMainGrad.addColorStop(0.6, `hsla(${(hue + 20) % 360},40%,54%,0.08)`)
        baseMainGrad.addColorStop(1, `hsla(${(hue + 35) % 360},36%,46%,0.06)`)
        ctx.fillStyle = baseMainGrad
        ctx.beginPath()
        if (ctx.roundRect) {
          ctx.roundRect(x, centerY - baseBarH, barW, baseBarH, [RADIUS, RADIUS, 0, 0])
        } else {
          ctx.rect(x, centerY - baseBarH, barW, baseBarH)
        }
        ctx.fill()
      }

      // 메인 바 + idle
      idleTimeRef.current += 0.025
      const idleHeights = idleHeightsRef.current

      for (let i = 0; i < BAR_COUNT; i++) {
        const rawVal = readBinAvg(i)
        const pyramidScale = getPyramidScale(i)
        const val = getShapedVisualizerValue(rawVal, fadeScale, pyramidScale)
        const visibleVal = hasAudibleEnergy ? Math.max(val, amplitudeFloor * pyramidScale) : val

        if (!hasAudibleEnergy && visibleVal < 0.005) {
          peaks[i] = 0
          peakHold[i] = 0

          if (idleHeights) {
            const wave1 = Math.sin(idleTimeRef.current + i * 0.18) * 0.5 + 0.5
            const wave2 = Math.sin(idleTimeRef.current * 0.7 + i * 0.31 + 1.2) * 0.5 + 0.5
            const waveVal = wave1 * 0.65 + wave2 * 0.35
            const targetH = Math.max(2, Math.floor(MAX_H * 0.025 * waveVal * pyramidScale + 2))
            idleHeights[i] = idleHeights[i] * 0.88 + targetH * 0.12
            const iH = Math.max(1, Math.round(idleHeights[i]))

            const { x, barW } = getBarGeometry(i)
            const hue = (hueOffsetRef.current + (i / BAR_COUNT) * 200) % 360
            ctx.fillStyle = `hsla(${hue},50%,70%,${0.1 + waveVal * 0.12})`
            ctx.beginPath()
            if (ctx.roundRect) {
              ctx.roundRect(x, centerY - iH, barW, iH, [RADIUS, RADIUS, 0, 0])
            } else {
              ctx.rect(x, centerY - iH, barW, iH)
            }
            ctx.fill()
          }
          continue
        }

        if (idleHeights) {
          idleHeights[i] *= 0.7
        }

        const { x, barW } = getBarGeometry(i)
        const barH = Math.max(2, Math.floor(MAX_H * visibleVal))

        const hue = (hueOffsetRef.current + (i / BAR_COUNT) * 200) % 360
        const hueTop = hue
        const hueMid = (hue + 20) % 360
        const hueBot = (hue + 40) % 360
        const hueQ = (hue + 30) % 360

        const sat = 65 + visibleVal * 20
        const litTop = 78 + visibleVal * 14
        const litMid = 58 + visibleVal * 10
        const litBot = 40 + visibleVal * 8
        const aTop = 0.36 + visibleVal * 0.18
        const aMid = 0.26 + visibleVal * 0.14
        const aBot = 0.15 + visibleVal * 0.14

        if (barH > peaks[i]) {
          peaks[i] = barH
          peakHold[i] = 48
        } else if (peakHold[i] > 0) {
          peakHold[i] -= 1
        } else {
          peaks[i] = Math.max(0, peaks[i] * 0.96)
        }

        if (visibleVal > 0.15) {
          ctx.save()
          ctx.shadowColor = `hsla(${hueTop},${sat}%,70%,${visibleVal * 0.55})`
          ctx.shadowBlur = Math.floor(6 + visibleVal * 18)
          ctx.fillStyle = `hsla(${hueTop},${sat}%,65%,${visibleVal * 0.06})`
          ctx.fillRect(x - 1, centerY - barH - 2, barW + 2, barH + 3)
          ctx.restore()
        }

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

        if (visibleVal > 0.1) {
          const hlH = Math.max(2, Math.floor(barH * 0.22))
          const gradHL = ctx.createLinearGradient(x, centerY - barH, x, centerY - barH + hlH)
          gradHL.addColorStop(0, `rgba(255,255,255,${0.1 + visibleVal * 0.42})`)
          gradHL.addColorStop(0.45, `rgba(255,255,255,${0.03 + visibleVal * 0.16})`)
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

        if (visibleVal > 0.25 && barW >= 3) {
          const edgeGrad = ctx.createLinearGradient(x, centerY - barH, x, centerY)
          edgeGrad.addColorStop(0, `hsla(${hueTop},90%,92%,${visibleVal * 0.45})`)
          edgeGrad.addColorStop(0.6, `hsla(${hueTop},80%,80%,${visibleVal * 0.15})`)
          edgeGrad.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.fillStyle = edgeGrad
          ctx.fillRect(x, centerY - barH, 1, barH)
        }

        const peakH = Math.floor(peaks[i])
        if (peakH > 4) {
          const isHolding = peakHold[i] > 0
          const peakAlpha = isHolding ? 0.98 : 0.46 * Math.min(1, peaks[i] / Math.max(1, peakH))

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

      // 파티클 업데이트 & 생성
      const particles = particlesRef.current

      // 각 바의 꼭대기에서 에너지가 높을 때 파티클 생성
      for (let i = 0; i < BAR_COUNT; i++) {
        const rawVal = readBinAvg(i)
        const pyramidScale = getPyramidScale(i)
        const val = getShapedVisualizerValue(rawVal, fadeScale, pyramidScale)
        const visibleVal = hasAudibleEnergy ? Math.max(val, amplitudeFloor * pyramidScale) : val

        // 에너지가 충분하고 확률적으로 파티클 생성 (너무 많으면 지저분함)
        if (visibleVal > 0.15 && Math.random() < visibleVal * 0.25) {
          const { x, barW } = getBarGeometry(i)
          const barH = Math.max(2, Math.floor(MAX_H * visibleVal))
          const hue = (hueOffsetRef.current + (i / BAR_COUNT) * 200) % 360
          particles.push({
            x: x + barW / 2 + (Math.random() - 0.5) * barW,
            y: centerY - barH,
            vx: (Math.random() - 0.5) * 1.2,
            vy: -(Math.random() * 2.0 + 0.8), // 위로 튀어오름
            life: 1,
            maxLife: 0.6 + Math.random() * 0.6,
            size: Math.random() * 2.0 + 0.8,
            hue
          })
        }
      }

      // 파티클 이동 & 그리기 (최대 200개 유지)
      if (particles.length > 200) particles.splice(0, particles.length - 200)

      for (let p = particles.length - 1; p >= 0; p--) {
        const pt = particles[p]
        pt.x += pt.vx
        pt.y += pt.vy
        pt.vy += 0.06 // 중력
        pt.vx *= 0.98 // 수평 감속
        pt.life -= 1 / (60 * pt.maxLife) // 60fps 기준 서서히 소멸

        if (pt.life <= 0) {
          particles.splice(p, 1)
          continue
        }

        const alpha = pt.life * pt.life * 0.85 // 이차 감쇠로 자연스럽게
        ctx.save()
        ctx.globalAlpha = canvasOpacityRef.current * alpha
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${pt.hue},80%,85%,1)`
        ctx.fill()
        ctx.restore()
      }

      ctx.globalAlpha = 1
      animationFrameRef.current = requestAnimationFrame(draw)
    }

    if (animationFrameRef.current === null) {
      draw()
    }

    return () => {
      stopDrawLoop()
    }
  }, [analysisActive, audioLevelRef, stopDrawLoop, videoRef, visible, seekbarRef])

  useEffect(
    () => () => {
      stopDrawLoop()
      if (audioLevelRef) {
        audioLevelRef.current = 0
      }
      sourceRef.current?.disconnect()
      analyserRef.current?.disconnect()
      void audioContextRef.current?.close()
    },
    [audioLevelRef, stopDrawLoop]
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
