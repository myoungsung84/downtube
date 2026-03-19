import AudiotrackIcon from '@mui/icons-material/Audiotrack'
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary'
import {
  alpha,
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { useSettingsStore } from '@renderer/features/settings/store/use-settings-store'
import { useI18n } from '@renderer/shared/hooks/use-i18n'
import type { AppLanguagePreference } from '@src/types/settings.types'
import React, { useEffect } from 'react'

// ─── shared sx ────────────────────────────────────────────────────────────────

const TOGGLE_GROUP_SX: SxProps<Theme> = {
  bgcolor: 'action.hover',
  borderRadius: '10px',
  p: 0.5,
  border: '1px solid',
  borderColor: (theme: Theme) =>
    theme.palette.mode === 'light'
      ? alpha(theme.palette.primary.main, 0.15)
      : alpha(theme.palette.common.white, 0.06),
  gap: 0.5,
  '& .MuiToggleButtonGroup-grouped': {
    border: 'none !important',
    borderRadius: '8px !important',
    m: 0
  },
  '& .MuiToggleButton-root': {
    px: 2.25,
    py: 0.875,
    fontWeight: 600,
    fontSize: '0.8rem',
    color: 'text.secondary',
    transition: 'all 0.18s ease',
    '&.Mui-selected': {
      bgcolor: (theme: Theme) =>
        theme.palette.mode === 'light'
          ? alpha(theme.palette.primary.main, 0.1)
          : theme.palette.background.paper,
      color: 'text.primary',
      boxShadow: (theme: Theme) =>
        theme.palette.mode === 'light'
          ? `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.24)}, 0 1px 3px ${alpha(theme.palette.common.black, 0.08)}`
          : `0 1px 4px ${alpha(theme.palette.common.black, 0.15)}`,
      '&:hover': {
        bgcolor: (theme: Theme) =>
          theme.palette.mode === 'light'
            ? alpha(theme.palette.primary.main, 0.14)
            : theme.palette.background.paper
      }
    },
    '&:hover:not(.Mui-selected)': {
      bgcolor: (theme: Theme) =>
        theme.palette.mode === 'light'
          ? alpha(theme.palette.primary.main, 0.06)
          : theme.palette.action.selected
    }
  }
}

// ─── keys ─────────────────────────────────────────────────────────────────────

const APP_LANGUAGE_KEY = 'app.language' as const
const APP_THEME_MODE_KEY = 'app.themeMode' as const
const DOWNLOADS_DEFAULT_TYPE_KEY = 'downloads.defaultType' as const
const DOWNLOADS_PLAYLIST_LIMIT_KEY = 'downloads.playlistLimit' as const

export default function SettingsScreen(): React.JSX.Element {
  const { t, changeLanguage } = useI18n('settings')
  const hydrateSettings = useSettingsStore((state) => state.hydrateSettings)
  const setSettingValue = useSettingsStore((state) => state.setValue)
  const storedLanguage = useSettingsStore((state) => state.values[APP_LANGUAGE_KEY])
  const storedThemeMode = useSettingsStore((state) => state.values[APP_THEME_MODE_KEY])
  const storedDefaultType = useSettingsStore((state) => state.values[DOWNLOADS_DEFAULT_TYPE_KEY])
  const storedPlaylistLimit = useSettingsStore(
    (state) => state.values[DOWNLOADS_PLAYLIST_LIMIT_KEY]
  )

  const language: AppLanguagePreference =
    storedLanguage === 'ko' || storedLanguage === 'en' ? storedLanguage : 'system'
  const themeMode: 'light' | 'dark' | 'system' =
    storedThemeMode === 'light' || storedThemeMode === 'dark' ? storedThemeMode : 'system'
  const defaultType: 'video' | 'audio' = storedDefaultType === 'audio' ? 'audio' : 'video'
  const playlistLimit =
    typeof storedPlaylistLimit === 'number' &&
    Number.isFinite(storedPlaylistLimit) &&
    Number.isInteger(storedPlaylistLimit) &&
    storedPlaylistLimit >= 1
      ? storedPlaylistLimit
      : 10

  useEffect(() => {
    void hydrateSettings([
      APP_LANGUAGE_KEY,
      APP_THEME_MODE_KEY,
      DOWNLOADS_DEFAULT_TYPE_KEY,
      DOWNLOADS_PLAYLIST_LIMIT_KEY
    ])
  }, [hydrateSettings])

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Stack sx={{ width: '100%', maxWidth: 720, p: 3 }} spacing={3}>
        {/* Header */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: (theme) => `0 2px 8px ${alpha(theme.palette.primary.main, 0.4)}`
            }}
          >
            <SettingsOutlinedIcon sx={{ fontSize: 20, color: 'primary.contrastText' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} lineHeight={1.1}>
              {t('header.title')}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {t('header.description')}
            </Typography>
          </Box>
        </Stack>

        {/* Appearance Section */}
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
            <Typography
              variant="overline"
              fontWeight={700}
              color="text.secondary"
              letterSpacing={1.5}
            >
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
                <ToggleButton value="system">
                  {t('appearance.language.options.system')}
                </ToggleButton>
                <ToggleButton value="ko">{t('appearance.language.options.ko')}</ToggleButton>
                <ToggleButton value="en">{t('appearance.language.options.en')}</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            <Stack sx={{ py: 2.5 }} spacing={2}>
              <Stack spacing={0.4}>
                <Typography variant="body2" fontWeight={700}>
                  {t('appearance.theme.title')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('appearance.theme.description')}
                </Typography>
              </Stack>

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
          </Stack>
        </Paper>

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
                    theme.palette.info.main,
                    0.012
                  )} 100%)`
                : theme.palette.background.paper
          }}
        >
          {/* Section header */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ px: 3, py: 2, bgcolor: 'action.hover' }}
          >
            <Typography
              variant="overline"
              fontWeight={700}
              color="text.secondary"
              letterSpacing={1.5}
            >
              {t('downloads.section_title')}
            </Typography>
          </Stack>

          <Divider />

          <Stack divider={<Divider />}>
            {/* Default format setting */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={2}
              sx={{ px: 3, py: 2.5 }}
            >
              <Stack spacing={0.4}>
                <Typography variant="body2" fontWeight={700}>
                  {t('downloads.default_type.title')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('downloads.default_type.description')}
                </Typography>
              </Stack>

              <ToggleButtonGroup
                size="small"
                exclusive
                value={defaultType}
                onChange={(_, next): void => {
                  if (!next) return
                  if (next !== 'video' && next !== 'audio') return
                  void setSettingValue(DOWNLOADS_DEFAULT_TYPE_KEY, next)
                }}
                sx={[TOGGLE_GROUP_SX, { flexShrink: 0, '& .MuiToggleButton-root': { px: 2 } }]}
              >
                <ToggleButton value="video">
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <VideoLibraryIcon sx={{ fontSize: 15 }} />
                    <span>{t('media.video')}</span>
                  </Stack>
                </ToggleButton>
                <ToggleButton value="audio">
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <AudiotrackIcon sx={{ fontSize: 15 }} />
                    <span>{t('media.audio')}</span>
                  </Stack>
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            {/* Playlist limit setting */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={2}
              sx={{ px: 3, py: 2.5 }}
            >
              <Stack spacing={0.4}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" fontWeight={700}>
                    {t('downloads.playlist_limit.title')}
                  </Typography>
                  <Chip
                    icon={<PlaylistPlayIcon sx={{ fontSize: '14px !important' }} />}
                    label={t('downloads.playlist_limit.badge', { count: playlistLimit })}
                    size="small"
                    variant="outlined"
                    color="primary"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      bgcolor: (theme) =>
                        theme.palette.mode === 'light'
                          ? alpha(theme.palette.primary.main, 0.08)
                          : undefined,
                      borderColor: (theme) =>
                        theme.palette.mode === 'light'
                          ? alpha(theme.palette.primary.main, 0.28)
                          : undefined,
                      '& .MuiChip-label': { px: 1 }
                    }}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {t('downloads.playlist_limit.description')}
                </Typography>
              </Stack>

              <ToggleButtonGroup
                size="small"
                exclusive
                value={String(playlistLimit)}
                onChange={(_, next): void => {
                  if (!next) return
                  const parsed = Number(next)
                  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) return
                  void setSettingValue(DOWNLOADS_PLAYLIST_LIMIT_KEY, parsed)
                }}
                sx={[
                  TOGGLE_GROUP_SX,
                  { flexShrink: 0, '& .MuiToggleButton-root': { px: 2.5, minWidth: 56 } }
                ]}
              >
                <ToggleButton value="10">{t('downloads.playlist_limit.options.10')}</ToggleButton>
                <ToggleButton value="20">{t('downloads.playlist_limit.options.20')}</ToggleButton>
                <ToggleButton value="40">{t('downloads.playlist_limit.options.40')}</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  )
}
