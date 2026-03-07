import { Box, LinearProgress, Stack, Typography } from '@mui/material'
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
            color: 'rgba(255,255,255,0.52)',
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
            color: '#fff',
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
            backgroundColor: 'rgba(255,255,255,0.1)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 999,
              background:
                'linear-gradient(90deg, rgba(150,170,255,0.92) 0%, rgba(255,255,255,0.92) 100%)'
            }
          }}
        />
      </Box>

      <Typography
        sx={{
          fontSize: '0.78rem',
          fontWeight: 300,
          color: 'rgba(255,255,255,0.44)',
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
          color: 'rgba(255,255,255,0.48)',
          lineHeight: 1.65,
          textAlign: 'center'
        }}
      >
        {logText}
      </Typography>
    </Stack>
  )
}
