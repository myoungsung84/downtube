import appIcon from '@assets/app-icon.svg'
import { Box, Stack, Typography } from '@mui/material'
import React from 'react'

type SplashBrandProps = {
  isError: boolean
}

const softPulseStyle = {
  '@keyframes softPulse': {
    '0%': { transform: 'scale(1)', opacity: 0.55 },
    '50%': { transform: 'scale(1.04)', opacity: 0.9 },
    '100%': { transform: 'scale(1)', opacity: 0.55 }
  },
  animation: 'softPulse 2.4s ease-in-out infinite'
} as const

export function SplashBrand({ isError }: SplashBrandProps): React.JSX.Element {
  return (
    <Stack spacing={1.4} alignItems="center">
      <Box
        component="img"
        src={appIcon}
        alt="DownTube"
        sx={{
          width: 74,
          height: 74,
          objectFit: 'contain',
          ...(isError ? {} : softPulseStyle)
        }}
      />

      <Typography
        sx={{
          fontWeight: 600,
          fontSize: '1.75rem',
          letterSpacing: '-0.3px',
          color: 'text.primary'
        }}
      >
        DownTube
      </Typography>
    </Stack>
  )
}
