import { Box } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { formatSeconds } from '../../lib'

type PlayerSeekbarProps = {
  uiVisible: boolean
  seekbarRef: React.RefObject<HTMLDivElement | null>
  hoverTime: number | null
  hoverX: number
  duration: number
  currentSeekVal: number
  onSeekbarMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void
  onSeekbarMouseLeave: () => void
  onSeekChange: (_: Event, val: number | number[]) => void
  onSeekCommit: (_: React.SyntheticEvent | Event, val: number | number[]) => void
  seekSliderSx: SxProps<Theme>
}

export function PlayerSeekbar({
  uiVisible,
  seekbarRef,
  hoverTime,
  hoverX,
  duration,
  currentSeekVal,
  onSeekbarMouseMove,
  onSeekbarMouseLeave,
  onSeekChange,
  onSeekCommit
}: PlayerSeekbarProps): React.JSX.Element {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragAbortRef = useRef<AbortController | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  const progress = duration > 0 ? (currentSeekVal / duration) * 100 : 0
  const active = isDragging || isHovering

  const getValueFromEvent = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
      if (!trackRef.current) return null
      const rect = trackRef.current.getBoundingClientRect()
      if (rect.width <= 0) return null
      const trackDuration = duration || 100
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      const raw = (x / rect.width) * trackDuration
      return Math.min(Math.max(raw, 0), trackDuration)
    },
    [duration]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(true)
      const val = getValueFromEvent(e)
      if (val !== null) onSeekChange(new Event('change'), val)

      if (dragAbortRef.current) dragAbortRef.current.abort()
      const controller = new AbortController()
      dragAbortRef.current = controller
      const { signal } = controller

      const handleMouseMove = (mv: MouseEvent): void => {
        const v = getValueFromEvent(mv)
        if (v !== null) onSeekChange(new Event('change'), v)
      }
      const handleMouseUp = (up: MouseEvent): void => {
        setIsDragging(false)
        const v = getValueFromEvent(up)
        if (v !== null) onSeekCommit(new Event('change'), v)
        controller.abort()
      }
      window.addEventListener('mousemove', handleMouseMove, { signal })
      window.addEventListener('mouseup', handleMouseUp, { signal })
    },
    [getValueFromEvent, onSeekChange, onSeekCommit]
  )

  useEffect(() => {
    return () => {
      dragAbortRef.current?.abort()
    }
  }, [])

  const handleTrackMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setIsHovering(true)
      onSeekbarMouseMove(e)
    },
    [onSeekbarMouseMove]
  )
  const handleTrackMouseLeave = useCallback(() => {
    setIsHovering(false)
    onSeekbarMouseLeave()
  }, [onSeekbarMouseLeave])

  const rainbowGradient = `linear-gradient(
    90deg,
    hsl(0,   45%, 65%) 0%,
    hsl(30,  45%, 62%) 16%,
    hsl(55,  40%, 60%) 32%,
    hsl(130, 35%, 58%) 48%,
    hsl(205, 45%, 62%) 64%,
    hsl(260, 40%, 65%) 80%,
    hsl(300, 38%, 63%) 100%
  )`

  return (
    <>
      <style>{`
        @keyframes rainbow-hue {
          0%   { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
        @keyframes seekbar-tooltip-in {
          from { opacity: 0; transform: translateX(-50%) translateY(3px) scale(0.93); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes thumb-pulse {
          0%, 100% { box-shadow: 0 0 0 0   rgba(255,255,255,0.5); }
          50%       { box-shadow: 0 0 0 4px rgba(255,255,255,0); }
        }
      `}</style>

      <Box
        sx={{
          position: 'absolute',
          bottom: 44,
          left: 0,
          right: 0,
          px: 0,
          pointerEvents: uiVisible ? 'auto' : 'none',
          opacity: uiVisible ? 1 : 0,
          transition: 'opacity 0.5s ease',
          zIndex: 4
        }}
      >
        <Box
          ref={seekbarRef}
          sx={{ position: 'relative', mx: 0 }}
          onMouseMove={handleTrackMouseMove}
          onMouseLeave={handleTrackMouseLeave}
        >
          {hoverTime !== null && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 'calc(100% + 10px)',
                left: hoverX,
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
                zIndex: 10,
                animation: 'seekbar-tooltip-in 0.14s ease forwards'
              }}
            >
              <Box
                sx={{
                  background: (theme) => alpha(theme.palette.common.black, 0.9),
                  backdropFilter: 'blur(10px)',
                  border: (theme) => `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                  color: 'common.white',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  fontFamily: '"SF Mono","Fira Code","Courier New",monospace',
                  letterSpacing: '0.05em',
                  fontVariantNumeric: 'tabular-nums',
                  px: '9px',
                  py: '4px',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                  boxShadow: (theme) => `0 4px 16px ${alpha(theme.palette.common.black, 0.5)}`
                }}
              >
                {formatSeconds(hoverTime)}
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderTop: (theme) => `4px solid ${alpha(theme.palette.common.black, 0.9)}`
                }}
              />
            </Box>
          )}

          <Box
            ref={trackRef}
            onMouseDown={handleMouseDown}
            sx={{
              position: 'relative',
              height: active ? '5px' : '3px',
              py: '6px',
              boxSizing: 'content-box',
              cursor: 'pointer',
              transition: 'height 0.18s cubic-bezier(0.4,0,0.2,1)'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                transform: 'translateY(-50%)',
                height: 'inherit',
                borderRadius: '999px',
                background: (theme) => alpha(theme.palette.common.white, 0.15)
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: 0,
                width: `${Math.min(progress + 12, 100)}%`,
                transform: 'translateY(-50%)',
                height: 'inherit',
                borderRadius: '999px',
                background: (theme) => alpha(theme.palette.common.white, 0.08),
                transition: 'width 0.6s ease'
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: 0,
                width: '100%',
                transform: 'translateY(-50%)',
                height: 'inherit',
                borderRadius: '999px',
                background: rainbowGradient,
                clipPath: `inset(0 ${100 - progress}% 0 0 round 999px)`,
                transition: 'clip-path 0.08s linear',
                animation: 'rainbow-hue 8s linear infinite',
                WebkitMaskImage: 'linear-gradient(90deg, black 0%, black 88%, transparent 100%)',
                maskImage: 'linear-gradient(90deg, black 0%, black 88%, transparent 100%)',
                zIndex: 1
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: `${progress}%`,
                transform: 'translate(-50%, -50%)',
                width: active ? '12px' : '0px',
                height: active ? '12px' : '0px',
                borderRadius: '50%',
                background: 'common.white',
                pointerEvents: 'none',
                zIndex: 4,
                transition:
                  'width 0.18s cubic-bezier(0.4,0,0.2,1), height 0.18s cubic-bezier(0.4,0,0.2,1)',
                animation: isDragging ? 'thumb-pulse 1s ease-in-out infinite' : 'none'
              }}
            />
          </Box>
        </Box>
      </Box>
    </>
  )
}
