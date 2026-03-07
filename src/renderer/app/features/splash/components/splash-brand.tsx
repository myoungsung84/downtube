import appIcon from '@assets/app-icon.svg'
import { Box, Stack, Typography } from '@mui/material'
import React from 'react'

type SplashBrandProps = {
  isError: boolean
}

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
          animation: isError ? 'none' : 'softPulse 2.4s ease-in-out infinite'
        }}
      />

      <Typography
        sx={{
          fontWeight: 600,
          fontSize: '1.75rem',
          letterSpacing: '-0.3px',
          color: '#fff'
        }}
      >
        DownTube
      </Typography>
    </Stack>
  )
}
