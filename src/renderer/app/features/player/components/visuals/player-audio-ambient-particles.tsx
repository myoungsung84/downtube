import { Box } from '@mui/material'
import { alpha, keyframes } from '@mui/material/styles'
import React, { useEffect, useMemo, useRef } from 'react'

const drift = keyframes`
  0% {
    transform: translate3d(0, 0, 0) scale(calc(0.96 + var(--ambient-scale-gain, 0)));
    opacity: 0;
  }
  18% {
    opacity: calc(var(--particle-base-opacity) * var(--ambient-alpha-gain, 1));
  }
  100% {
    transform: translate3d(
      calc(var(--particle-drift-x) * var(--ambient-motion-gain, 1)),
      calc(var(--particle-drift-y) * var(--ambient-motion-gain, 1)),
      0
    )
    scale(calc(1.08 + var(--ambient-scale-gain, 0)));
    opacity: 0;
  }
`

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
}

const PARTICLE_COUNT = 22

export function PlayerAudioAmbientParticles({
  enabled,
  audioLevelRef
}: {
  enabled: boolean
  audioLevelRef?: React.MutableRefObject<number>
}): React.JSX.Element | null {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const particles = useMemo<AmbientParticle[]>(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
      id: index,
      left: `${6 + Math.random() * 88}%`,
      top: `${8 + Math.random() * 80}%`,
      size: 4 + Math.random() * 6,
      opacity: 0.14 + Math.random() * 0.13,
      duration: 11 + Math.random() * 8,
      delay: -Math.random() * 14,
      driftX: `${(Math.random() - 0.5) * 52}px`,
      driftY: `${-42 - Math.random() * 44}px`,
      twinkleDuration: 4.5 + Math.random() * 3.2,
      twinkleDelay: -Math.random() * 5,
      energyBias: 0.95 + Math.random() * 0.75
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
        smoothedLevel = smoothedLevel * 0.84 + nextLevel * 0.16
      }

      const energy = smoothedLevel < 0.01 ? 0 : Math.min(1, smoothedLevel / 0.118)
      const alphaGain = 0.7 + energy * 1.22
      const motionGain = 0.82 + energy * 0.82
      const scaleGain = energy * 0.19
      const layerOpacity = 0.8 + energy * 0.22

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
  }, [audioLevelRef])

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
            'radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 62%)'
        }
      }}
    >
      {particles.map((particle) => (
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
            borderRadius: '50%',
            opacity:
              'calc(0.76 + (var(--ambient-alpha-gain, 1) - 1) * var(--particle-energy-bias))',
            backgroundColor: (theme) => alpha(theme.palette.common.white, particle.opacity),
            boxShadow: (theme) =>
              `0 0 ${Math.max(3, particle.size * 1.15)}px ${alpha(theme.palette.common.white, particle.opacity * 0.12)}`,
            animation: `${drift} ${particle.duration}s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`,
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: '-22%',
              borderRadius: '50%',
              backgroundColor: (theme) =>
                alpha(theme.palette.common.white, particle.opacity * 0.22),
              opacity:
                'calc(0.62 + (var(--ambient-alpha-gain, 1) - 1) * var(--particle-energy-bias))',
              animation: `${drift} ${particle.twinkleDuration}s ease-in-out infinite`,
              animationDelay: `${particle.twinkleDelay}s`
            }
          }}
        />
      ))}
    </Box>
  )
}
