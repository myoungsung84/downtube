import AudiotrackIcon from '@mui/icons-material/Audiotrack'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary'
import { Box, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useSettingsStore } from '@renderer/features/settings/store/use-settings-store'
import React, { useEffect } from 'react'

const DOWNLOADS_DEFAULT_TYPE_KEY = 'downloads.defaultType' as const
const DOWNLOADS_PLAYLIST_LIMIT_KEY = 'downloads.playlistLimit' as const

export default function SettingsScreen(): React.JSX.Element {
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
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Stack sx={{ p: 3, width: '100%', maxWidth: 1000 }} spacing={3}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <SettingsOutlinedIcon color="primary" />
          <Typography variant="h5" fontWeight={800}>
            설정
          </Typography>
        </Stack>

        <Paper
          elevation={2}
          sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
        >
          <Stack spacing={2.5}>
            <Typography variant="h6" fontWeight={700}>
              다운로드
            </Typography>

            <Stack spacing={1.25}>
              <Typography variant="body2" color="text.secondary" fontWeight={700}>
                기본 다운로드 형식
              </Typography>

              <ToggleButtonGroup
                size="medium"
                exclusive
                value={defaultType}
                onChange={(_, next): void => {
                  if (!next) return
                  if (next !== 'video' && next !== 'audio') return
                  void setSettingValue(DOWNLOADS_DEFAULT_TYPE_KEY, next)
                }}
                sx={{
                  '& .MuiToggleButton-root': {
                    px: 3,
                    py: 1.25,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    borderRadius: 2
                  }
                }}
              >
                <ToggleButton value="video">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <VideoLibraryIcon sx={{ fontSize: 20 }} />
                    <span>비디오 (영상+음성)</span>
                  </Stack>
                </ToggleButton>
                <ToggleButton value="audio">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AudiotrackIcon sx={{ fontSize: 20 }} />
                    <span>오디오만</span>
                  </Stack>
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            <Stack spacing={1.25}>
              <Typography variant="body2" color="text.secondary" fontWeight={700}>
                플레이리스트 다운로드 개수
              </Typography>

              <ToggleButtonGroup
                size="medium"
                exclusive
                value={String(playlistLimit)}
                onChange={(_, next): void => {
                  if (!next) return
                  const parsed = Number(next)
                  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) return
                  void setSettingValue(DOWNLOADS_PLAYLIST_LIMIT_KEY, parsed)
                }}
                sx={{
                  '& .MuiToggleButton-root': {
                    px: 3,
                    py: 1.25,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    borderRadius: 2
                  }
                }}
              >
                <ToggleButton value="10">10개</ToggleButton>
                <ToggleButton value="20">20개</ToggleButton>
                <ToggleButton value="40">40개</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  )
}
