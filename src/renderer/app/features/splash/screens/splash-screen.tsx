import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import type { InitState } from '@src/types/init.types'
import React from 'react'
import { useNavigate } from 'react-router-dom'

const defaultRunningState: InitState = { status: 'running' }

function mapStepToText(step?: string): string {
  const labels: Record<string, string> = {
    'setting-up': '환경을 준비하고 있어요',
    'checking-binaries': '필수 파일을 확인하고 있어요',
    'downloading-binaries': '필수 파일을 내려받고 있어요',
    finalizing: '마무리 작업 중이에요',
    'starting-services': '서비스를 시작하고 있어요'
  }

  if (!step) return '잠시만 기다려 주세요'
  return labels[step] ?? '잠시만 기다려 주세요'
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;600&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`

export default function SplashScreen(): React.JSX.Element {
  const navigate = useNavigate()
  const [state, setState] = React.useState(defaultRunningState)

  const runInit = React.useCallback(async () => {
    setState(defaultRunningState)
    const result = await window.appApi.initApp()
    setState(result)
    if (result.status === 'ready') navigate('/')
  }, [navigate])

  React.useEffect(() => {
    const unsubscribe = window.appApi.onInitState((nextState) => {
      setState(nextState)
      if (nextState.status === 'ready') navigate('/')
    })
    void runInit()
    return unsubscribe
  }, [navigate, runInit])

  const isError = state.status === 'error'
  const stepText = state.status === 'running' ? mapStepToText(state.step) : '잠시만 기다려 주세요'

  return (
    <>
      <style>{STYLES}</style>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        sx={{ background: '#0f1117' }}
      >
        <Stack alignItems="center" spacing={4} sx={{ animation: 'fadeUp 0.5s ease both' }}>
          <Typography
            sx={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: '1.75rem',
              letterSpacing: '-0.3px',
              color: '#fff'
            }}
          >
            DownTube
          </Typography>

          {isError ? (
            <Stack alignItems="center" spacing={1.5}>
              <Typography
                sx={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: '#ff7070'
                }}
              >
                시작하지 못했어요
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.78rem',
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.35)',
                  textAlign: 'center',
                  maxWidth: 300,
                  lineHeight: 1.7
                }}
              >
                {state.message}
              </Typography>
              <Button
                onClick={() => void runInit()}
                sx={{
                  mt: 1,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.8rem',
                  fontWeight: 400,
                  textTransform: 'none',
                  color: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '100px',
                  px: 3,
                  py: 0.8,
                  '&:hover': {
                    background: 'rgba(255,255,255,0.06)',
                    borderColor: 'rgba(255,255,255,0.28)'
                  }
                }}
              >
                다시 시도하기
              </Button>
            </Stack>
          ) : (
            <Stack alignItems="center" spacing={2.5}>
              <CircularProgress size={28} thickness={3} sx={{ color: 'rgba(255,255,255,0.5)' }} />
              <Typography
                sx={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.78rem',
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.35)',
                  letterSpacing: '0.03em'
                }}
              >
                {stepText}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Box>
    </>
  )
}
