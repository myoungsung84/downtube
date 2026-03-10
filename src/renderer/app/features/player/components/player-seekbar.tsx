import { Box, Slider } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import React from 'react'

import { formatSeconds } from '../lib/player-format'

type PlayerSeekbarProps = {
  uiVisible: boolean
  visualizerVisible: boolean
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
  visualizerVisible,
  seekbarRef,
  hoverTime,
  hoverX,
  duration,
  currentSeekVal,
  onSeekbarMouseMove,
  onSeekbarMouseLeave,
  onSeekChange,
  onSeekCommit,
  seekSliderSx
}: PlayerSeekbarProps): React.JSX.Element {
  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 44,
        left: 0,
        right: 0,
        px: 0,
        pointerEvents: uiVisible ? 'auto' : 'none',
        opacity: uiVisible ? 1 : visualizerVisible ? 0.42 : 0,
        transition: 'opacity 0.5s ease',
        zIndex: 4
      }}
    >
      <Box
        ref={seekbarRef}
        sx={{ position: 'relative', mx: 0 }}
        onMouseMove={onSeekbarMouseMove}
        onMouseLeave={onSeekbarMouseLeave}
      >
        {hoverTime !== null && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: hoverX,
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0,0,0,0.82)',
              color: '#fff',
              fontSize: '0.68rem',
              fontWeight: 700,
              px: 1,
              py: 0.35,
              borderRadius: '5px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              fontVariantNumeric: 'tabular-nums',
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
            }}
          >
            {formatSeconds(hoverTime)}
          </Box>
        )}
        <Slider
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentSeekVal}
          onChange={onSeekChange}
          onChangeCommitted={onSeekCommit}
          sx={seekSliderSx}
        />
      </Box>
    </Box>
  )
}
