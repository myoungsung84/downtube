import { Box, Slider, Stack, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'
import { useI18n } from '@renderer/shared/hooks/use-i18n'
import React from 'react'

import { formatSeconds } from '../../lib'
import type { PlayerRepeatMode } from '../../types/player.types'
import {
  IcAmbientParticles,
  IcExitFullscreen,
  IcFullscreen,
  IcNextTrack,
  IcPreviousTrack,
  IcQueueList,
  IcRepeat,
  IcRepeatOne,
  IcVisualizer,
  IcVolumeHigh,
  IcVolumeMute
} from '../visuals/player-icons'
import { PlayerButton } from './player-button'

function ControlDivider(): React.JSX.Element {
  return (
    <Box
      sx={{
        width: '1px',
        height: 14,
        backgroundColor: (theme) => alpha(theme.palette.common.white, 0.13),
        mx: '6px',
        flexShrink: 0
      }}
    />
  )
}

type PlayerBottomControlsProps = {
  uiVisible: boolean
  visualizerVisible: boolean
  ambientParticlesEnabled: boolean
  queuePanelOpen: boolean
  muted: boolean
  volume: number
  currentSeekVal: number
  duration: number
  currentIndex: number
  queueLength: number
  repeatMode: PlayerRepeatMode
  isFullscreen: boolean
  canGoPrevious: boolean
  canGoNext: boolean
  nextItemLabel?: string
  onToggleMute: () => void
  onVolumeChange: (_: Event, val: number | number[]) => void
  onVolumeCommit: (_: React.SyntheticEvent | Event, val: number | number[]) => void
  onPreviousTrack: () => void
  onNextTrack: () => void
  onCycleRepeatMode: () => void
  onToggleVisualizer: () => void
  onToggleAmbientParticles: () => void
  onToggleQueuePanel: () => void
  onToggleFullscreen: () => void
  volSliderSx: SxProps<Theme>
}

export function PlayerBottomControls({
  uiVisible,
  visualizerVisible,
  ambientParticlesEnabled,
  queuePanelOpen,
  muted,
  volume,
  currentSeekVal,
  duration,
  currentIndex,
  queueLength,
  repeatMode,
  isFullscreen,
  canGoPrevious,
  canGoNext,
  nextItemLabel,
  onToggleMute,
  onVolumeChange,
  onVolumeCommit,
  onPreviousTrack,
  onNextTrack,
  onCycleRepeatMode,
  onToggleVisualizer,
  onToggleAmbientParticles,
  onToggleQueuePanel,
  onToggleFullscreen,
  volSliderSx
}: PlayerBottomControlsProps): React.JSX.Element {
  const { t } = useI18n('player')
  const repeatTitle =
    repeatMode === 'one'
      ? t('controls.bottom.repeat_one')
      : repeatMode === 'all'
        ? t('controls.bottom.repeat_all')
        : t('controls.bottom.repeat_off')

  const showNextUp = !queuePanelOpen && !!nextItemLabel && queueLength > 1

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
        {/* Left: volume + time + queue context */}
        <Stack direction="row" alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
          {/* Volume */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
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

          <ControlDivider />

          {/* Time */}
          <Stack direction="row" alignItems="center" spacing={0} sx={{ flexShrink: 0 }}>
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
                sx={{ color: (theme) => alpha(theme.palette.common.white, 0.28), mx: '5px' }}
              >
                /
              </Box>
              {formatSeconds(duration)}
            </Typography>

            {/* Queue position */}
            {queueLength > 1 ? (
              <Typography
                sx={{
                  ml: 1.5,
                  color: (theme) => alpha(theme.palette.common.white, 0.4),
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                  userSelect: 'none'
                }}
              >
                {currentIndex + 1} / {queueLength}
              </Typography>
            ) : null}
          </Stack>

          {/* Next up (only when queue panel is closed and there's a next item) */}
          {showNextUp ? (
            <>
              <ControlDivider />
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.5}
                sx={{ minWidth: 0, overflow: 'hidden' }}
              >
                <Typography
                  sx={{
                    flexShrink: 0,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    color: (theme) => alpha(theme.palette.common.white, 0.3),
                    userSelect: 'none',
                    letterSpacing: '0.02em'
                  }}
                >
                  {t('controls.bottom.next_up')}
                </Typography>
                <Typography
                  title={nextItemLabel}
                  sx={{
                    fontSize: '0.68rem',
                    fontWeight: 400,
                    color: (theme) => alpha(theme.palette.common.white, 0.45),
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                    maxWidth: 160
                  }}
                >
                  {nextItemLabel}
                </Typography>
              </Stack>
            </>
          ) : null}
        </Stack>

        {/* Right: nav | queue | effects | fullscreen */}
        <Stack direction="row" alignItems="center" spacing={0} sx={{ flexShrink: 0 }}>
          {/* Navigation: prev / next / repeat */}
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <PlayerButton
              onClick={onPreviousTrack}
              title={t('controls.bottom.previous')}
              size="sm"
              disabled={!canGoPrevious}
            >
              <IcPreviousTrack />
            </PlayerButton>
            <PlayerButton
              onClick={onNextTrack}
              title={t('controls.bottom.next')}
              size="sm"
              disabled={!canGoNext}
            >
              <IcNextTrack />
            </PlayerButton>
            <PlayerButton
              onClick={onCycleRepeatMode}
              title={repeatTitle}
              size="sm"
              active={repeatMode !== 'off'}
            >
              <Box
                sx={{
                  display: 'flex',
                  color: (theme) =>
                    repeatMode === 'off'
                      ? alpha(theme.palette.common.white, 0.65)
                      : theme.palette.error.light
                }}
              >
                {repeatMode === 'one' ? <IcRepeatOne /> : <IcRepeat />}
              </Box>
            </PlayerButton>
          </Stack>

          <ControlDivider />

          {/* Queue toggle */}
          <PlayerButton
            onClick={onToggleQueuePanel}
            title={t('controls.bottom.queue')}
            size="sm"
            active={queuePanelOpen}
          >
            <Box
              sx={{
                display: 'flex',
                color: (theme) =>
                  queuePanelOpen
                    ? theme.palette.error.light
                    : alpha(theme.palette.common.white, 0.65)
              }}
            >
              <IcQueueList />
            </Box>
          </PlayerButton>

          <ControlDivider />

          {/* Effects */}
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
          </Stack>

          <ControlDivider />

          {/* Fullscreen */}
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
