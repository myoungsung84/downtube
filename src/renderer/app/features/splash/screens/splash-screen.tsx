import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import type { InitState } from '@src/types/init.types'
import React from 'react'
import { useNavigate } from 'react-router-dom'

const defaultRunningState: InitState = { status: 'running' }

function mapStepToText(step?: string): string {
  const labels: Record<string, string> = {
    'setting-up': '환경 준비 중…',
    'checking-binaries': '바이너리 확인 중…',
    'downloading-binaries': '필수 파일 다운로드 중…',
    finalizing: '초기 마무리 중…',
    'starting-services': '서비스 시작 중…'
  }

  if (!step) {
    return '초기화 중…'
  }

  return labels[step] ?? '초기화 중…'
}

export default function SplashScreen(): React.JSX.Element {
  const navigate = useNavigate()
  const [state, setState] = React.useState<InitState>(defaultRunningState)

  const runInit = React.useCallback(async () => {
    setState(defaultRunningState)

    const result = await window.api.initApp()
    setState(result)

    if (result.status === 'ready') {
      navigate('/')
    }
  }, [navigate])

  React.useEffect(() => {
    const unsubscribe = window.api.onInitState((nextState) => {
      setState(nextState)

      if (nextState.status === 'ready') {
        navigate('/')
      }
    })

    void runInit()

    return unsubscribe
  }, [navigate, runInit])

  const isError = state.status === 'error'
  const stepText = state.status === 'running' ? mapStepToText(state.step) : '초기화 중…'

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100svh',
        backgroundColor: 'background.default',
        px: 3
      }}
    >
      <Stack
        spacing={2}
        alignItems="center"
        sx={{ width: '100%', maxWidth: 420, textAlign: 'center' }}
      >
        <Typography variant="h4" fontWeight={700}>
          DownTube
        </Typography>

        {isError ? (
          <>
            <Typography variant="h6" color="error.main">
              초기화 실패
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
              {state.message}
            </Typography>
            <Button variant="contained" onClick={() => void runInit()}>
              다시 시도
            </Button>
          </>
        ) : (
          <>
            <CircularProgress />
            <Typography variant="body1" color="text.secondary">
              {stepText}
            </Typography>
          </>
        )}
      </Stack>
    </Box>
  )
}
