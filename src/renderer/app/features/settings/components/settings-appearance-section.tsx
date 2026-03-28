import {
  alpha,
  Divider,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import { useSettingsStore } from '@renderer/features/settings/store/use-settings-store'
import { useI18n } from '@renderer/shared/hooks/use-i18n'
import type { AppLanguagePreference, AppThemePreset } from '@src/types/settings.types'
import { isAppThemePreset } from '@src/types/settings.types'
import React, { useEffect } from 'react'

import { TOGGLE_GROUP_SX } from './settings-toggle-group-sx'

const APP_LANGUAGE_KEY = 'app.language' as const
const APP_THEME_MODE_KEY = 'app.themeMode' as const
const APP_THEME_PRESET_KEY = 'app.themePreset' as const

export function AppearanceSection(): React.JSX.Element {
  const { t, changeLanguage } = useI18n('settings')
  const hydrateSettings = useSettingsStore((state) => state.hydrateSettings)
  const setSettingValue = useSettingsStore((state) => state.setValue)
  const storedLanguage = useSettingsStore((state) => state.values[APP_LANGUAGE_KEY])
  const storedThemeMode = useSettingsStore((state) => state.values[APP_THEME_MODE_KEY])
  const storedThemePreset = useSettingsStore((state) => state.values[APP_THEME_PRESET_KEY])

  const language: AppLanguagePreference =
    storedLanguage === 'ko' || storedLanguage === 'en' ? storedLanguage : 'system'
  const themeMode: 'light' | 'dark' | 'system' =
    storedThemeMode === 'light' || storedThemeMode === 'dark' ? storedThemeMode : 'system'

  const rawPreset: AppThemePreset = isAppThemePreset(storedThemePreset)
    ? storedThemePreset
    : 'default'

  // mode와 맞지 않는 preset은 default로 표시
  const themePreset: AppThemePreset = (() => {
    if (themeMode === 'system') return 'default'
    if (themeMode === 'light') return rawPreset === 'slate' ? 'slate' : 'default'
    if (rawPreset === 'ink' || rawPreset === 'jade' || rawPreset === 'aurora') return rawPreset
    return 'default'
  })()

  useEffect(() => {
    void hydrateSettings([APP_LANGUAGE_KEY, APP_THEME_MODE_KEY, APP_THEME_PRESET_KEY])
  }, [hydrateSettings])

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        background: (theme) =>
          theme.palette.mode === 'light'
            ? `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(
                theme.palette.primary.main,
                0.015
              )} 100%)`
            : theme.palette.background.paper
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ px: 3, py: 2, bgcolor: 'action.hover' }}
      >
        <Typography variant="overline" fontWeight={700} color="text.secondary" letterSpacing={1.5}>
          {t('appearance.section_title')}
        </Typography>
      </Stack>

      <Divider />

      <Stack divider={<Divider />} sx={{ px: 3 }}>
        <Stack sx={{ py: 2.5 }} spacing={2}>
          <Stack spacing={0.4}>
            <Typography variant="body2" fontWeight={700}>
              {t('appearance.language.title')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('appearance.language.description')}
            </Typography>
          </Stack>

          <ToggleButtonGroup
            size="small"
            exclusive
            value={language}
            onChange={(_, next): void => {
              if (next !== 'system' && next !== 'ko' && next !== 'en') return
              void setSettingValue(APP_LANGUAGE_KEY, next).then((savedLanguage) => {
                void window.api
                  .resolveAppLanguage(savedLanguage)
                  .then((resolvedLanguage) => changeLanguage(resolvedLanguage))
              })
            }}
            sx={[TOGGLE_GROUP_SX, { width: 'fit-content' }]}
          >
            <ToggleButton value="system">{t('appearance.language.options.system')}</ToggleButton>
            <ToggleButton value="ko">{t('appearance.language.options.ko')}</ToggleButton>
            <ToggleButton value="en">{t('appearance.language.options.en')}</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {/* Theme: mode + preset in one block */}
        <Stack sx={{ py: 2.5 }} spacing={2.5}>
          <Stack spacing={0.4}>
            <Typography variant="body2" fontWeight={700}>
              {t('appearance.theme.title')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('appearance.theme.description')}
            </Typography>
          </Stack>

          {/* Mode */}
          <Stack spacing={1}>
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              {t('appearance.theme.mode_label')}
            </Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={themeMode}
              onChange={(_, next): void => {
                if (!next) return
                if (next !== 'system' && next !== 'light' && next !== 'dark') return
                void setSettingValue(APP_THEME_MODE_KEY, next)
              }}
              sx={[TOGGLE_GROUP_SX, { width: 'fit-content' }]}
            >
              <ToggleButton value="system">{t('appearance.theme.options.system')}</ToggleButton>
              <ToggleButton value="light">{t('appearance.theme.options.light')}</ToggleButton>
              <ToggleButton value="dark">{t('appearance.theme.options.dark')}</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {/* Preset */}
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="baseline">
              <Typography
                variant="caption"
                fontWeight={600}
                color={themeMode === 'system' ? 'text.disabled' : 'text.secondary'}
              >
                {t('appearance.theme_preset.title')}
              </Typography>
              {themeMode === 'system' && (
                <Typography variant="caption" color="text.disabled">
                  {t('appearance.theme_preset.description_system')}
                </Typography>
              )}
            </Stack>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={themePreset}
              disabled={themeMode === 'system'}
              onChange={(_, next): void => {
                if (!next) return
                if (!isAppThemePreset(next)) return
                void setSettingValue(APP_THEME_PRESET_KEY, next)
              }}
              sx={[TOGGLE_GROUP_SX, { width: 'fit-content' }]}
            >
              <ToggleButton value="default">
                {t('appearance.theme_preset.options.default')}
              </ToggleButton>
              {themeMode === 'light' && (
                <ToggleButton value="slate">
                  {t('appearance.theme_preset.options.slate')}
                </ToggleButton>
              )}
              {themeMode === 'dark' && (
                <ToggleButton value="ink">{t('appearance.theme_preset.options.ink')}</ToggleButton>
              )}
              {themeMode === 'dark' && (
                <ToggleButton value="jade">
                  {t('appearance.theme_preset.options.jade')}
                </ToggleButton>
              )}
              {themeMode === 'dark' && (
                <ToggleButton value="aurora">
                  {t('appearance.theme_preset.options.aurora')}
                </ToggleButton>
              )}
            </ToggleButtonGroup>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  )
}
