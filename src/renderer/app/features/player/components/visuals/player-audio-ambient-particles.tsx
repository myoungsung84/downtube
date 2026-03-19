import { Box } from '@mui/material'
import { keyframes } from '@mui/material/styles'
import React, { useEffect, useMemo, useRef } from 'react'

const drift = keyframes`
  0% {
    transform: translate3d(0, 0, 0) scale(calc(0.86 + var(--ambient-scale-gain, 0)));
    opacity: 0;
  }
  12% {
    opacity: calc(
      var(--particle-base-opacity) * var(--ambient-alpha-gain, 1) * var(--particle-energy-bias, 1)
    );
  }
  55% {
    transform: translate3d(
      calc(var(--particle-drift-x) * var(--ambient-motion-gain, 1) * 0.55),
      calc(var(--particle-drift-y) * var(--ambient-motion-gain, 1) * 0.55),
      0
    ) scale(calc(1.08 + var(--ambient-scale-gain, 0) * 1.5));
  }
  80% {
    opacity: calc(
      var(--particle-base-opacity) * var(--ambient-alpha-gain, 1) * var(--particle-energy-bias, 1)
    );
  }
  100% {
    transform: translate3d(
      calc(var(--particle-drift-x) * var(--ambient-motion-gain, 1)),
      calc(var(--particle-drift-y) * var(--ambient-motion-gain, 1)),
      0
    ) scale(calc(1.18 + var(--ambient-scale-gain, 0)));
    opacity: 0;
  }
`

// 5-tone subtle color palette: white, ice blue, soft lavender, warm gold, mint
const PALETTE: [number, number, number][] = [
  [255, 255, 255],
  [188, 216, 255],
  [212, 188, 255],
  [255, 226, 164],
  [164, 255, 208]
]

type AmbientParticle = {
  id: number
  left: string
  top: string
  size: number
  opacity: number
  duration: number
  delay: number
  driftX: string
  driftY: string
  twinkleDuration: number
  twinkleDelay: number
  energyBias: number
  colorRgb: [number, number, number]
  isOval: boolean
}

const PARTICLE_COUNT = 28

export function PlayerAudioAmbientParticles({
  enabled,
  audioLevelRef
}: {
  enabled: boolean
  audioLevelRef?: React.MutableRefObject<number>
}): React.JSX.Element | null {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const prevEnergyRef = useRef(0)

  const particles = useMemo<AmbientParticle[]>(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
      id: index,
      left: `${5 + Math.random() * 90}%`,
      top: `${6 + Math.random() * 82}%`,
      size: 5 + Math.random() * 10,
      opacity: 0.22 + Math.random() * 0.2,
      duration: 9 + Math.random() * 8,
      delay: -Math.random() * 13,
      driftX: `${(Math.random() - 0.5) * 84}px`,
      driftY: `${-55 - Math.random() * 55}px`,
      twinkleDuration: 3.5 + Math.random() * 3.5,
      twinkleDelay: -Math.random() * 5,
      energyBias: 0.9 + Math.random() * 0.9,
      colorRgb: PALETTE[index % PALETTE.length],
      isOval: Math.random() > 0.6
    }))
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let frameId: number | null = null
    let smoothedLevel = 0

    const applyLevel = (): void => {
      const nextLevel = Math.max(0, Math.min(1, audioLevelRef?.current ?? 0))
      if (nextLevel > smoothedLevel) {
        smoothedLevel = smoothedLevel * 0.48 + nextLevel * 0.52
      } else {
        smoothedLevel = smoothedLevel * 0.72 + nextLevel * 0.28
      }

      const energy = smoothedLevel < 0.01 ? 0 : Math.min(1, smoothedLevel / 0.38)

      // Beat detection: spike when energy rises rapidly
      const beatBoost = Math.min(0.7, Math.max(0, energy - prevEnergyRef.current) * 7)
      prevEnergyRef.current = prevEnergyRef.current * 0.88 + energy * 0.12

      const alphaGain = 0.3 + energy * 1.7 + beatBoost * 0.9
      const motionGain = 0.5 + energy * 1.2
      const scaleGain = energy * 0.28 + beatBoost * 0.18
      const layerOpacity = 0.12 + energy * 0.9

      el.style.setProperty('--ambient-alpha-gain', alphaGain.toFixed(3))
      el.style.setProperty('--ambient-motion-gain', motionGain.toFixed(3))
      el.style.setProperty('--ambient-scale-gain', scaleGain.toFixed(3))
      el.style.setProperty('--ambient-layer-opacity', layerOpacity.toFixed(3))

      frameId = window.requestAnimationFrame(applyLevel)
    }

    frameId = window.requestAnimationFrame(applyLevel)

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [audioLevelRef, enabled])

  if (!enabled) return null

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 'var(--ambient-layer-opacity, 0.9)',
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 60%, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 68%)'
        }
      }}
    >
      {particles.map((particle) => {
        const [r, g, b] = particle.colorRgb
        const glowBlur = Math.max(5, particle.size * 2.2)
        return (
          <Box
            key={particle.id}
            sx={{
              '--particle-drift-x': particle.driftX,
              '--particle-drift-y': particle.driftY,
              '--particle-base-opacity': particle.opacity.toFixed(3),
              '--particle-energy-bias': particle.energyBias.toFixed(3),
              position: 'absolute',
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              borderRadius: particle.isOval ? '60% / 38%' : '50%',
              backgroundColor: `rgba(${r}, ${g}, ${b}, ${particle.opacity.toFixed(3)})`,
              boxShadow: [
                `0 0 ${glowBlur.toFixed(1)}px rgba(${r}, ${g}, ${b}, ${(particle.opacity * 0.6).toFixed(3)})`,
                `0 0 ${(glowBlur * 2.8).toFixed(1)}px rgba(${r}, ${g}, ${b}, ${(particle.opacity * 0.22).toFixed(3)})`
              ].join(', '),
              animation: `${drift} ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: '-28%',
                borderRadius: '50%',
                backgroundColor: `rgba(${r}, ${g}, ${b}, ${(particle.opacity * 0.18).toFixed(3)})`,
                animation: `${drift} ${particle.twinkleDuration}s ease-in-out infinite`,
                animationDelay: `${particle.twinkleDelay}s`
              }
            }}
          />
        )
      })}
    </Box>
  )
}
