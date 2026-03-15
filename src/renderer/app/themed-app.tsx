import { CssBaseline, useMediaQuery } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { useSettingsStore } from '@renderer/features/settings/store/use-settings-store'
import { useEffect, useMemo, useState } from 'react'

import App from './app'
import createAppTheme from './theme/create-app-theme'

const APP_THEME_MODE_KEY = 'app.themeMode' as const
const THEME_MODE_CACHE_KEY = 'downtube.themeMode'

type ThemeMode = 'light' | 'dark' | 'system'

function readCachedThemeMode(): ThemeMode | undefined {
  if (typeof window === 'undefined') return undefined

  const raw = window.localStorage.getItem(THEME_MODE_CACHE_KEY)
  if (raw === 'light' || raw === 'dark' || raw === 'system') {
    return raw
  }
  return undefined
}

export default function ThemedApp(): React.JSX.Element {
  const hydrateSetting = useSettingsStore((state) => state.hydrateSetting)
  const storedThemeMode = useSettingsStore((state) => state.values[APP_THEME_MODE_KEY])
  const [cachedThemeMode, setCachedThemeMode] = useState<ThemeMode>(
    () => readCachedThemeMode() ?? 'system'
  )
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true })

  useEffect(() => {
    void hydrateSetting(APP_THEME_MODE_KEY)
  }, [hydrateSetting])

  useEffect(() => {
    if (!storedThemeMode) return

    setCachedThemeMode(storedThemeMode)
    window.localStorage.setItem(THEME_MODE_CACHE_KEY, storedThemeMode)
  }, [storedThemeMode])

  const themeMode = storedThemeMode ?? cachedThemeMode
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
