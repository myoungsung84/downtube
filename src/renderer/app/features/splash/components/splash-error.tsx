import { Button, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import React from 'react'

type SplashErrorProps = {
  message: string
  onRetry: () => void
}

export function SplashError({ message, onRetry }: SplashErrorProps): React.JSX.Element {
  return (
    <Stack alignItems="center" spacing={1.75}>
      <Typography
        sx={{
          fontSize: '0.98rem',
          fontWeight: 600,
          color: 'error.light'
        }}
      >
        초기화 중 문제가 발생했어요
      </Typography>
      <Typography
        sx={{
          fontSize: '0.8rem',
          fontWeight: 300,
          color: (theme) => alpha(theme.palette.text.primary, 0.65),
          textAlign: 'center',
          maxWidth: 320,
          lineHeight: 1.7
        }}
      >
        {message}
      </Typography>
      <Button
        onClick={onRetry}
        sx={{
          mt: 0.5,
          fontSize: '0.83rem',
          fontWeight: 500,
          textTransform: 'none',
          color: 'text.primary',
          background: (theme) => alpha(theme.palette.text.primary, 0.08),
          border: '1px solid',
          borderColor: (theme) => alpha(theme.palette.text.primary, 0.18),
          borderRadius: '100px',
          px: 3,
          py: 0.9,
          '&:hover': {
            background: (theme) => alpha(theme.palette.text.primary, 0.14),
            borderColor: (theme) => alpha(theme.palette.text.primary, 0.28)
          }
        }}
      >
        다시 시도하기
      </Button>
    </Stack>
  )
}
