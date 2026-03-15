import { Box, LinearProgress, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import React from 'react'

type SplashRunningProps = {
  stepText: string
  stepDetail: string
  progressValue: number
  logText: string
}

export function SplashRunning({
  stepText,
  stepDetail,
  progressValue,
  logText
}: SplashRunningProps): React.JSX.Element {
  return (
    <Stack spacing={2.4} sx={{ width: '100%' }}>
      <Stack spacing={0.5} alignItems="center">
        <Typography
          sx={{
            fontSize: '0.8rem',
            fontWeight: 500,
            color: (theme) => alpha(theme.palette.text.primary, 0.56),
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}
        >
          initialization
        </Typography>
        <Typography
          sx={{
            fontSize: '0.94rem',
            fontWeight: 500,
            color: 'text.primary',
            textAlign: 'center'
          }}
        >
          {stepText}
        </Typography>
      </Stack>

      <Box sx={{ width: '100%' }}>
        <LinearProgress
          variant="determinate"
          value={progressValue}
          sx={{
            height: 8,
            borderRadius: 999,
            backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.12),
            '& .MuiLinearProgress-bar': {
              borderRadius: 999,
              background: (theme) =>
                `linear-gradient(90deg, ${alpha(theme.palette.primary.light, 0.92)} 0%, ${alpha(
                  theme.palette.common.white,
                  theme.palette.mode === 'dark' ? 0.92 : 0.7
                )} 100%)`
            }
          }}
        />
      </Box>

      <Typography
        sx={{
          fontSize: '0.78rem',
          fontWeight: 300,
          color: (theme) => alpha(theme.palette.text.primary, 0.5),
          lineHeight: 1.7,
          minHeight: '2.6em',
          textAlign: 'center'
        }}
      >
        {stepDetail}
      </Typography>

      <Typography
        sx={{
          fontSize: '0.75rem',
          fontWeight: 400,
          color: (theme) => alpha(theme.palette.text.secondary, 0.86),
          lineHeight: 1.65,
          textAlign: 'center'
        }}
      >
        {logText}
      </Typography>
    </Stack>
  )
}
