import { Box } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'
import React from 'react'

type PlayerButtonProps = {
  onClick: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  sx?: SxProps<Theme>
}

export function PlayerButton({
  onClick,
  title,
  children,
  size = 'md',
  sx: sxOverride
}: PlayerButtonProps): React.JSX.Element {
  const pad = size === 'lg' ? '14px' : size === 'sm' ? '6px' : '9px'

  return (
    <Box
      component="button"
      onClick={onClick}
      title={title}
      sx={[
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          color: 'common.white',
          cursor: 'pointer',
          p: pad,
          borderRadius: '50%',
          transition: 'background 0.15s, transform 0.1s',
          flexShrink: 0,
          '&:hover': {
            backgroundColor: (theme) => alpha(theme.palette.common.white, 0.15),
            transform: 'scale(1.08)'
          },
          '&:active': {
            backgroundColor: (theme) => alpha(theme.palette.common.white, 0.22),
            transform: 'scale(0.95)'
          }
        },
        ...(sxOverride == null ? [] : Array.isArray(sxOverride) ? sxOverride : [sxOverride])
      ]}
    >
      {children}
    </Box>
  )
}
