import { Box } from '@mui/material'
import React, { useCallback, useEffect, useRef } from 'react'

const MIN_AMPLITUDE_THRESHOLD = 0.03

type PlayerAudioVisualizerOverlayProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>
  visible: boolean
  seekbarRef: React.RefObject<HTMLDivElement | null>
}

export default function PlayerAudioVisualizerOverlay({
  videoRef,
  visible,
  seekbarRef
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

    const buildMelBins = (binCount: number, sampleRate: number): number[] => {
      const fMin = 20
      const fMax = Math.min(16000, (sampleRate / 2) * 0.95)
      const nyquist = sampleRate / 2
      const hzPerBin = nyquist / binCount

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

      let centerY = h - Math.floor(h * 0.135)
      const seekEl = seekbarRef.current
      if (seekEl) {
        const canvasRect = canvas.getBoundingClientRect()
        const seekRect = seekEl.getBoundingClientRect()
        const seekCenterY = seekRect.top + seekRect.height / 2 - canvasRect.top
        centerY = Math.round(seekCenterY * dpr)
      }

      const GAP = 0

      const MAX_H = Math.floor(h * 0.46)
      const MAX_REFLECT = Math.floor(h * 0.1)
      const RADIUS = Math.max(1, Math.floor((DRAW_W - GAP * (BAR_COUNT - 1)) / BAR_COUNT / 2))

      let totalEnergy = 0
      for (let i = 0; i < dataArray.length; i++) {
        totalEnergy += dataArray[i]
      }
      const avgAmplitude = totalEnergy / (dataArray.length * 255)

      const prevSmoothed = smoothedAmplitudeRef.current
      if (avgAmplitude > prevSmoothed) {
        smoothedAmplitudeRef.current = avgAmplitude * 0.6 + prevSmoothed * 0.4
      } else {
        smoothedAmplitudeRef.current = prevSmoothed * 0.97
      }
      const smoothedAmp = smoothedAmplitudeRef.current
      const hasAudibleEnergy = smoothedAmp > MIN_AMPLITUDE_THRESHOLD
      const amplitudeFloor = hasAudibleEnergy ? 0.01 : 0

      if (smoothedAmp < 0.001) {
        peaks.fill(0)
        peakHold.fill(0)
        animationFrameRef.current = requestAnimationFrame(draw)
        return
      }

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

      const sampleRate = audioContext.sampleRate
      const melBins = buildMelBins(dataArray.length, sampleRate)

      ctx.save()
      ctx.beginPath()
      ctx.rect(0, centerY + 1, DRAW_W, MAX_REFLECT)
      ctx.clip()

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
        const rawVal = sum / count / 255
        const val = getShapedVisualizerValue(rawVal, fadeScale)
        const visibleVal = hasAudibleEnergy ? Math.max(val, amplitudeFloor) : val

        if (visibleVal < 0.005) continue

        const x = Math.round((i / BAR_COUNT) * DRAW_W)
        const nextX = Math.round(((i + 1) / BAR_COUNT) * DRAW_W)
        const barW = Math.max(1, nextX - x - GAP)
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

          const x = Math.round((i / BAR_COUNT) * DRAW_W)
          const nextX = Math.round(((i + 1) / BAR_COUNT) * DRAW_W)
          const barW = Math.max(1, nextX - x - GAP)
          const idleY = centerY - 2
          ctx.fillStyle = 'rgba(255,255,255,0.12)'
          ctx.beginPath()
          if (ctx.roundRect) {
            ctx.roundRect(x, idleY, barW, 1.5, 1)
          } else {
            ctx.rect(x, idleY, barW, 1.5)
          }
          ctx.fill()
          continue
        }

        const x = Math.round((i / BAR_COUNT) * DRAW_W)
        const nextX = Math.round(((i + 1) / BAR_COUNT) * DRAW_W)
        const barW = Math.max(1, nextX - x - GAP)
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

        if (barH > peaks[i]) {
          peaks[i] = barH
          peakHold[i] = 32
        } else if (peakHold[i] > 0) {
          peakHold[i] -= 1
        } else {
          peaks[i] = Math.max(0, peaks[i] * 0.92)
        }

        if (visibleVal > 0.15) {
          ctx.save()
          ctx.shadowColor = `hsla(${hueTop},${sat}%,70%,${visibleVal * 0.55})`
          ctx.shadowBlur = Math.floor(6 + visibleVal * 18)
          ctx.fillStyle = `hsla(${hueTop},${sat}%,65%,${visibleVal * 0.06})`
          ctx.fillRect(x - 1, centerY - barH - 2, barW + 2, barH + 3)
          ctx.restore()
        }

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
