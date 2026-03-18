import { Box, Stack } from '@mui/material'
import { useI18n } from '@renderer/shared/hooks/use-i18n'
import type { InitState } from '@src/types/init.types'
import React from 'react'
import { useNavigate } from 'react-router-dom'

import { SplashBrand } from '../components/splash-brand'
import { SplashError } from '../components/splash-error'
import { SplashRunning } from '../components/splash-running'
import { mapStepToDetailKey, mapStepToProgress, mapStepToTextKey } from '../lib/splash-step'

const STYLES = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`

const defaultRunningState: InitState = { status: 'running' }

export default function SplashScreen(): React.JSX.Element {
  const { t } = useI18n('splash')
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
  const currentStep = isRunning ? state.step : undefined
  const stepText = isRunning ? t(mapStepToTextKey(currentStep)) : t('status.waiting')
  const detailKey = mapStepToDetailKey(currentStep)
  const stepDetail = isRunning && detailKey ? t(detailKey) : ''
  const progressValue = Math.min(
    100,
    Math.max(0, isRunning ? (state.progress ?? mapStepToProgress(currentStep)) : 0)
  )
  const isDownloading = isRunning && currentStep === 'downloading-binaries'
  const logText = isDownloading
    ? t('log.auto_download_notice')
    : isRunning
      ? t('log.running', { stepText })
      : t('log.error_retry')

  return (
    <>
      <style>{STYLES}</style>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        sx={{
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'radial-gradient(circle at top, rgba(82, 109, 255, 0.16), transparent 32%), linear-gradient(180deg, #0d1018 0%, #0a0c12 100%)'
              : 'radial-gradient(circle at top, rgba(37, 99, 235, 0.13), transparent 34%), linear-gradient(180deg, #f7faff 0%, #eef3fb 100%)'
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
