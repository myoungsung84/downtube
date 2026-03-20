import { Box } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'
import React from 'react'

type PlayerButtonProps = {
  onClick: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  active?: boolean
  disabled?: boolean
  sx?: SxProps<Theme>
}

export function PlayerButton({
  onClick,
  title,
  children,
  size = 'md',
  active = false,
  disabled = false,
  sx: sxOverride
}: PlayerButtonProps): React.JSX.Element {
  const pad = size === 'lg' ? '14px' : size === 'sm' ? '6px' : '9px'

  return (
    <Box
      component="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      disabled={disabled}
      sx={[
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: (theme) =>
            active ? alpha(theme.palette.error.main, 0.2) : 'transparent',
          border: '1px solid',
          borderColor: (theme) => (active ? alpha(theme.palette.error.main, 0.42) : 'transparent'),
          color: 'common.white',
          cursor: disabled ? 'default' : 'pointer',
          p: pad,
          borderRadius: '50%',
          transition:
            'background-color 0.18s, border-color 0.18s, transform 0.1s, box-shadow 0.18s',
          flexShrink: 0,
          opacity: disabled ? 0.35 : 1,
          boxShadow: (theme) =>
            active
              ? `0 0 0 1px ${alpha(theme.palette.common.white, 0.06)}, 0 6px 14px ${alpha(theme.palette.common.black, 0.24)}`
              : 'none',
          '&:hover': disabled
            ? undefined
            : {
                backgroundColor: (theme) =>
                  active
                    ? alpha(theme.palette.error.main, 0.28)
                    : alpha(theme.palette.common.white, 0.15),
                transform: 'scale(1.08)'
              },
          '&:active': disabled
            ? undefined
            : {
                backgroundColor: (theme) =>
                  active
                    ? alpha(theme.palette.error.main, 0.34)
                    : alpha(theme.palette.common.white, 0.22),
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
