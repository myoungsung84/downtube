import { CssBaseline, useMediaQuery } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { useSettingsStore } from '@renderer/features/settings/store/use-settings-store'
import type { AppThemePreset } from '@src/types/settings.types'
import { isAppThemePreset } from '@src/types/settings.types'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'

import App from './app'
import createAppTheme from './theme/create-app-theme'

const APP_THEME_MODE_KEY = 'app.themeMode' as const
const APP_THEME_PRESET_KEY = 'app.themePreset' as const
const THEME_MODE_CACHE_KEY = 'downtube.themeMode'
const THEME_PRESET_CACHE_KEY = 'downtube.themePreset'

type ThemeMode = 'light' | 'dark' | 'system'

function readCachedThemeMode(): ThemeMode | undefined {
  if (typeof window === 'undefined') return undefined

  const raw = window.localStorage.getItem(THEME_MODE_CACHE_KEY)
  if (raw === 'light' || raw === 'dark' || raw === 'system') {
    return raw
  }
  return undefined
}

function readCachedThemePreset(): AppThemePreset | undefined {
  if (typeof window === 'undefined') return undefined

  const raw = window.localStorage.getItem(THEME_PRESET_CACHE_KEY)
  return isAppThemePreset(raw) ? raw : undefined
}

export default function ThemedApp(): React.JSX.Element {
  const hydrateSetting = useSettingsStore((state) => state.hydrateSetting)
  const storedThemeMode = useSettingsStore((state) => state.values[APP_THEME_MODE_KEY])
  const storedThemePreset = useSettingsStore((state) => state.values[APP_THEME_PRESET_KEY])
  const [cachedThemeMode, setCachedThemeMode] = useState<ThemeMode>(
    () => readCachedThemeMode() ?? 'system'
  )
  const [cachedThemePreset, setCachedThemePreset] = useState<AppThemePreset>(
    () => readCachedThemePreset() ?? 'default'
  )
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true })

  useEffect(() => {
    void hydrateSetting(APP_THEME_MODE_KEY)
    void hydrateSetting(APP_THEME_PRESET_KEY)
  }, [hydrateSetting])

  useEffect(() => {
    if (!storedThemeMode) return

    setCachedThemeMode(storedThemeMode)
    window.localStorage.setItem(THEME_MODE_CACHE_KEY, storedThemeMode)
  }, [storedThemeMode])

  useEffect(() => {
    if (!storedThemePreset) return

    setCachedThemePreset(storedThemePreset)
    window.localStorage.setItem(THEME_PRESET_CACHE_KEY, storedThemePreset)
  }, [storedThemePreset])

  const themeMode = storedThemeMode ?? cachedThemeMode
  const themePreset = storedThemePreset ?? cachedThemePreset
  const resolvedMode = themeMode === 'system' ? (prefersDark ? 'dark' : 'light') : themeMode

  // system mode는 항상 default preset으로 해석
  const effectivePreset: AppThemePreset = themeMode === 'system' ? 'default' : themePreset

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = resolvedMode
  }, [resolvedMode])

  const theme = useMemo(
    () => createAppTheme(resolvedMode, effectivePreset),
    [resolvedMode, effectivePreset]
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  )
}
