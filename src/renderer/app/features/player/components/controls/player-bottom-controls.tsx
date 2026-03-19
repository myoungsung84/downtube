import { Box, Slider, Stack, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'
import { useI18n } from '@renderer/shared/hooks/use-i18n'
import React from 'react'

import { formatSeconds } from '../../lib'
import {
  IcAmbientParticles,
  IcExitFullscreen,
  IcFullscreen,
  IcVisualizer,
  IcVolumeHigh,
  IcVolumeMute
} from '../visuals/player-icons'
import { PlayerButton } from './player-button'

type PlayerBottomControlsProps = {
  uiVisible: boolean
  visualizerVisible: boolean
  ambientParticlesEnabled: boolean
  muted: boolean
  volume: number
  currentSeekVal: number
  duration: number
  isFullscreen: boolean
  onToggleMute: () => void
  onVolumeChange: (_: Event, val: number | number[]) => void
  onVolumeCommit: (_: React.SyntheticEvent | Event, val: number | number[]) => void
  onToggleVisualizer: () => void
  onToggleAmbientParticles: () => void
  onToggleFullscreen: () => void
  volSliderSx: SxProps<Theme>
}

export function PlayerBottomControls({
  uiVisible,
  visualizerVisible,
  ambientParticlesEnabled,
  muted,
  volume,
  currentSeekVal,
  duration,
  isFullscreen,
  onToggleMute,
  onVolumeChange,
  onVolumeCommit,
  onToggleVisualizer,
  onToggleAmbientParticles,
  onToggleFullscreen,
  volSliderSx
}: PlayerBottomControlsProps): React.JSX.Element {
  const { t } = useI18n('player')
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
            <PlayerButton onClick={onToggleMute} title={t('controls.bottom.mute')} size="sm">
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
          <PlayerButton
            onClick={onToggleAmbientParticles}
            title={t('controls.bottom.ambient_particles')}
            size="sm"
            active={ambientParticlesEnabled}
          >
            <Box
              sx={{
                display: 'flex',
                color: (theme) =>
                  ambientParticlesEnabled
                    ? theme.palette.error.light
                    : alpha(theme.palette.common.white, 0.65)
              }}
            >
              <IcAmbientParticles />
            </Box>
          </PlayerButton>
          <PlayerButton
            onClick={onToggleVisualizer}
            title={t('controls.bottom.visualizer')}
            size="sm"
            active={visualizerVisible}
          >
            <Box
              sx={{
                display: 'flex',
                color: (theme) =>
                  visualizerVisible
                    ? theme.palette.error.light
                    : alpha(theme.palette.common.white, 0.65)
              }}
            >
              <IcVisualizer />
            </Box>
          </PlayerButton>
          <PlayerButton
            onClick={onToggleFullscreen}
            title={t('controls.bottom.fullscreen')}
            size="sm"
          >
            {isFullscreen ? <IcExitFullscreen /> : <IcFullscreen />}
          </PlayerButton>
        </Stack>
      </Stack>
    </Box>
  )
}
