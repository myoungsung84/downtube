import { Box } from '@mui/material'
import React from 'react'

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
      <Box
        component="button"
        onClick={onReplay10}
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

      <Box
        component="button"
        onClick={onTogglePlay}
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

      <Box
        component="button"
        onClick={onForward10}
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
  )
}
