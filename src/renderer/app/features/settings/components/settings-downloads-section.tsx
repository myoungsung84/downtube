import AudiotrackIcon from '@mui/icons-material/Audiotrack'
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay'
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary'
import {
  alpha,
  Chip,
  Divider,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import { useSettingsStore } from '@renderer/features/settings/store/use-settings-store'
import { useI18n } from '@renderer/shared/hooks/use-i18n'
import React, { useEffect } from 'react'

import { TOGGLE_GROUP_SX } from './settings-toggle-group-sx'

const DOWNLOADS_DEFAULT_TYPE_KEY = 'downloads.defaultType' as const
const DOWNLOADS_PLAYLIST_LIMIT_KEY = 'downloads.playlistLimit' as const

export function DownloadsSection(): React.JSX.Element {
  const { t } = useI18n('settings')
  const hydrateSettings = useSettingsStore((state) => state.hydrateSettings)
  const setSettingValue = useSettingsStore((state) => state.setValue)
  const storedDefaultType = useSettingsStore((state) => state.values[DOWNLOADS_DEFAULT_TYPE_KEY])
  const storedPlaylistLimit = useSettingsStore(
    (state) => state.values[DOWNLOADS_PLAYLIST_LIMIT_KEY]
  )

  const defaultType: 'video' | 'audio' = storedDefaultType === 'audio' ? 'audio' : 'video'
  const playlistLimit =
    typeof storedPlaylistLimit === 'number' &&
    Number.isFinite(storedPlaylistLimit) &&
    Number.isInteger(storedPlaylistLimit) &&
    storedPlaylistLimit >= 1
      ? storedPlaylistLimit
      : 10

  useEffect(() => {
    void hydrateSettings([DOWNLOADS_DEFAULT_TYPE_KEY, DOWNLOADS_PLAYLIST_LIMIT_KEY])
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
        <Typography variant="overline" fontWeight={700} color="text.secondary" letterSpacing={1.5}>
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
  )
}
