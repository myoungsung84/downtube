import { Box, Slider, Stack, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'
import React from 'react'

import { formatSeconds } from '../lib/player-format'
import { PlayerButton } from './player-button'
import {
  IcExitFullscreen,
  IcFullscreen,
  IcVisualizer,
  IcVolumeHigh,
  IcVolumeMute
} from './player-icons'

type PlayerBottomControlsProps = {
  uiVisible: boolean
  visualizerVisible: boolean
  allowFullscreen: boolean
  muted: boolean
  volume: number
  currentSeekVal: number
  duration: number
  isFullscreen: boolean
  onToggleMute: () => void
  onVolumeChange: (_: Event, val: number | number[]) => void
  onVolumeCommit: (_: React.SyntheticEvent | Event, val: number | number[]) => void
  onToggleVisualizer: () => void
  onToggleFullscreen: () => void
  volSliderSx: SxProps<Theme>
}

export function PlayerBottomControls({
  uiVisible,
  visualizerVisible,
  allowFullscreen,
  muted,
  volume,
  currentSeekVal,
  duration,
  isFullscreen,
  onToggleMute,
  onVolumeChange,
  onVolumeCommit,
  onToggleVisualizer,
  onToggleFullscreen,
  volSliderSx
}: PlayerBottomControlsProps): React.JSX.Element {
  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        pb: 1.5,
        pointerEvents: uiVisible ? 'auto' : 'none',
        opacity: uiVisible ? 1 : 0,
        transition: 'opacity 0.5s ease',
        zIndex: 4
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2 }}>
        <Stack direction="row" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={1}>
            <PlayerButton onClick={onToggleMute} title="음소거 (M)" size="sm">
              {muted || volume === 0 ? <IcVolumeMute /> : <IcVolumeHigh />}
            </PlayerButton>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={onVolumeChange}
              onChangeCommitted={onVolumeCommit}
              sx={volSliderSx}
            />
          </Stack>
          <Box
            sx={{
              width: '1px',
              height: 14,
              backgroundColor: (theme) => alpha(theme.palette.common.white, 0.15),
              mx: '18px',
              flexShrink: 0
            }}
          />
          <Typography
            sx={{
              color: (theme) => alpha(theme.palette.common.white, 0.88),
              fontSize: '0.78rem',
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              textShadow: (theme) => `0 1px 4px ${alpha(theme.palette.common.black, 0.6)}`
            }}
          >
            {formatSeconds(currentSeekVal)}
            <Box
              component="span"
              sx={{ color: (theme) => alpha(theme.palette.common.white, 0.28), mx: '6px' }}
            >
              /
            </Box>
            {formatSeconds(duration)}
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <PlayerButton onClick={onToggleVisualizer} title="음성 시각화" size="sm">
            <Box
              sx={{
                display: 'flex',
                color: (theme) => alpha(theme.palette.common.white, visualizerVisible ? 0.96 : 0.65)
              }}
            >
              <IcVisualizer />
            </Box>
          </PlayerButton>
          {allowFullscreen ? (
            <PlayerButton onClick={onToggleFullscreen} title="전체화면 (F)" size="sm">
              {isFullscreen ? <IcExitFullscreen /> : <IcFullscreen />}
            </PlayerButton>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  )
}
