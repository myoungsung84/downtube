import { Box, Stack } from '@mui/material'
import type { InitState } from '@src/types/init.types'
import React from 'react'
import { useNavigate } from 'react-router-dom'

import { SplashBrand } from '../components/splash-brand'
import { SplashError } from '../components/splash-error'
import { SplashRunning } from '../components/splash-running'
import { mapStepToDetail, mapStepToProgress, mapStepToText } from '../lib/splash-step'

const STYLES = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes softPulse {
    0% { transform: scale(1); opacity: 0.55; }
    50% { transform: scale(1.04); opacity: 0.9; }
    100% { transform: scale(1); opacity: 0.55; }
  }
`

const defaultRunningState: InitState = { status: 'running' }

export default function SplashScreen(): React.JSX.Element {
  const navigate = useNavigate()
  const [state, setState] = React.useState(defaultRunningState)

  const runInit = React.useCallback(async () => {
    setState(defaultRunningState)

    const result = await window.api.initApp()
    setState(result)
    if (result.status === 'ready') navigate('/')
  }, [navigate])

  React.useEffect(() => {
    const unsubscribe = window.api.onInitState((nextState) => {
      setState(nextState)
      if (nextState.status === 'ready') navigate('/')
    })
    void runInit()
    return unsubscribe
  }, [navigate, runInit])

  const isError = state.status === 'error'
  const isRunning = state.status === 'running'
  const stepText = isRunning ? mapStepToText(state.step) : '잠시만 기다려 주세요'
  const stepDetail = isRunning ? mapStepToDetail(state.step) : ''
  const progressValue = isRunning ? mapStepToProgress(state.step) : 0
  const isDownloading = isRunning && state.step === 'downloading-binaries'
  const logText = isDownloading
    ? '필수 파일이 없으면 자동 다운로드를 진행해요'
    : isRunning
      ? `${stepText} · 안정적으로 시작하는 중이에요`
      : '문제가 해결되면 다시 시도해 주세요'

  return (
    <>
      <style>{STYLES}</style>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        sx={{
          background:
            'radial-gradient(circle at top, rgba(82, 109, 255, 0.16), transparent 32%), linear-gradient(180deg, #0d1018 0%, #0a0c12 100%)'
        }}
      >
        <Stack
          spacing={3}
          alignItems="center"
          sx={{
            width: '100%',
            maxWidth: 420,
            px: 3,
            animation: 'fadeUp 0.5s ease both'
          }}
        >
          <SplashBrand isError={isError} />

          {isError ? (
            <SplashError message={state.message} onRetry={() => void runInit()} />
          ) : (
            <SplashRunning
              stepText={stepText}
              stepDetail={stepDetail}
              progressValue={progressValue}
              logText={logText}
            />
          )}
        </Stack>
      </Box>
    </>
  )
}
