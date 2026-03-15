import { Box } from '@mui/material'
import { alpha } from '@mui/material/styles'
import React from 'react'

import { PlayerButton } from './player-button'
import { IcForward10, IcPause, IcPlay, IcReplay10 } from './player-icons'

type PlayerCenterControlsProps = {
  uiVisible: boolean
  paused: boolean
  onReplay10: () => void
  onTogglePlay: () => void
  onForward10: () => void
}

export function PlayerCenterControls({
  uiVisible,
  paused,
  onReplay10,
  onTogglePlay,
  onForward10
}: PlayerCenterControlsProps): React.JSX.Element {
  return (
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
      <PlayerButton
        onClick={onReplay10}
        title="10초 뒤로 (←)"
        sx={{
          p: 0,
          width: 52,
          height: 52,
          background: (theme) => alpha(theme.palette.common.black, 0.28),
          border: (theme) => `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
          backdropFilter: 'blur(8px)',
          '&:hover': {
            backgroundColor: (theme) => alpha(theme.palette.common.black, 0.5),
            transform: 'scale(1.08)'
          },
          '&:active': { transform: 'scale(0.94)' }
        }}
      >
        <IcReplay10 />
      </PlayerButton>

      <PlayerButton
        onClick={onTogglePlay}
        title="재생/일시정지 (Space)"
        sx={{
          p: 0,
          width: 66,
          height: 66,
          background: (theme) => alpha(theme.palette.error.main, 0.38),
          border: (theme) => `1px solid ${alpha(theme.palette.error.main, 0.45)}`,
          backdropFilter: 'blur(12px)',
          boxShadow: (theme) => `0 4px 24px ${alpha(theme.palette.common.black, 0.3)}`,
          '&:hover': {
            backgroundColor: (theme) => alpha(theme.palette.error.main, 0.6),
            transform: 'scale(1.08)',
            boxShadow: (theme) => `0 6px 32px ${alpha(theme.palette.error.main, 0.35)}`
          },
          '&:active': { transform: 'scale(0.93)' }
        }}
      >
        {paused ? <IcPlay /> : <IcPause />}
      </PlayerButton>

      <PlayerButton
        onClick={onForward10}
        title="10초 앞으로 (→)"
        sx={{
          p: 0,
          width: 52,
          height: 52,
          background: (theme) => alpha(theme.palette.common.black, 0.28),
          border: (theme) => `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
          backdropFilter: 'blur(8px)',
          '&:hover': {
            backgroundColor: (theme) => alpha(theme.palette.common.black, 0.5),
            transform: 'scale(1.08)'
          },
          '&:active': { transform: 'scale(0.94)' }
        }}
      >
        <IcForward10 />
      </PlayerButton>
    </Box>
  )
}
