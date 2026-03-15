import './styles/fonts.css'
import './styles/global.css'

import { CssBaseline, useMediaQuery } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { useSettingsStore } from '@renderer/features/settings/store/use-settings-store'
import { StrictMode, useEffect, useMemo } from 'react'
import { createRoot } from 'react-dom/client'

import App from './app'
import createAppTheme from './theme/create-app-theme'

const APP_THEME_MODE_KEY = 'app.themeMode' as const

function ThemedApp() {
  const hydrateSetting = useSettingsStore((state) => state.hydrateSetting)
  const storedThemeMode = useSettingsStore((state) => state.values[APP_THEME_MODE_KEY])
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true })

  useEffect(() => {
    void hydrateSetting(APP_THEME_MODE_KEY)
  }, [hydrateSetting])

  const themeMode = storedThemeMode ?? 'system'
  const resolvedMode = themeMode === 'system' ? (prefersDark ? 'dark' : 'light') : themeMode

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedMode
  }, [resolvedMode])

  const theme = useMemo(() => createAppTheme(resolvedMode), [resolvedMode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemedApp />
  </StrictMode>
)
