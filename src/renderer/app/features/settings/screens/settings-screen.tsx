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
import { useSettingsStore } from '@renderer/features/settings/store/use-settings-store'
import React, { useEffect } from 'react'

const APP_THEME_MODE_KEY = 'app.themeMode' as const
const DOWNLOADS_DEFAULT_TYPE_KEY = 'downloads.defaultType' as const
const DOWNLOADS_PLAYLIST_LIMIT_KEY = 'downloads.playlistLimit' as const

export default function SettingsScreen(): React.JSX.Element {
  const hydrateSettings = useSettingsStore((state) => state.hydrateSettings)
  const setSettingValue = useSettingsStore((state) => state.setValue)
  const storedThemeMode = useSettingsStore((state) => state.values[APP_THEME_MODE_KEY])
  const storedDefaultType = useSettingsStore((state) => state.values[DOWNLOADS_DEFAULT_TYPE_KEY])
  const storedPlaylistLimit = useSettingsStore(
    (state) => state.values[DOWNLOADS_PLAYLIST_LIMIT_KEY]
  )

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
      APP_THEME_MODE_KEY,
      DOWNLOADS_DEFAULT_TYPE_KEY,
      DOWNLOADS_PLAYLIST_LIMIT_KEY
    ])
  }, [hydrateSettings])

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        pt: 1
      }}
    >
      <Stack sx={{ p: 3, width: '100%', maxWidth: 720 }} spacing={4}>
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
              설정
            </Typography>
            <Typography variant="caption" color="text.disabled">
              앱 환경을 맞춤 설정하세요
            </Typography>
          </Box>
        </Stack>

        {/* Downloads Section */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden'
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
              화면
            </Typography>
          </Stack>

          <Divider />

          <Stack sx={{ px: 3, py: 2.5 }} spacing={2}>
            <Stack spacing={0.4}>
              <Typography variant="body2" fontWeight={700}>
                테마
              </Typography>
              <Typography variant="caption" color="text.secondary">
                시스템 설정 또는 라이트/다크 테마를 선택합니다
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
              sx={{
                width: 'fit-content',
                bgcolor: 'action.hover',
                borderRadius: '10px',
                p: 0.5,
                border: 'none',
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
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    boxShadow: (theme) => `0 1px 4px ${alpha(theme.palette.common.black, 0.15)}`,
                    '&:hover': { bgcolor: 'background.paper' }
                  },
                  '&:hover:not(.Mui-selected)': {
                    bgcolor: 'action.selected'
                  }
                }
              }}
            >
              <ToggleButton value="system">시스템</ToggleButton>
              <ToggleButton value="light">라이트</ToggleButton>
              <ToggleButton value="dark">다크</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden'
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
              다운로드
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
                  기본 다운로드 형식
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  링크를 추가할 때 기본으로 선택될 형식입니다
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
                sx={{
                  flexShrink: 0,
                  bgcolor: 'action.hover',
                  borderRadius: '10px',
                  p: 0.5,
                  border: 'none',
                  gap: 0.5,
                  '& .MuiToggleButtonGroup-grouped': {
                    border: 'none !important',
                    borderRadius: '8px !important',
                    m: 0
                  },
                  '& .MuiToggleButton-root': {
                    px: 2,
                    py: 0.875,
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    color: 'text.secondary',
                    transition: 'all 0.18s ease',
                    '&.Mui-selected': {
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                      boxShadow: (theme) => `0 1px 4px ${alpha(theme.palette.common.black, 0.15)}`,
                      '&:hover': { bgcolor: 'background.paper' }
                    },
                    '&:hover:not(.Mui-selected)': {
                      bgcolor: 'action.selected'
                    }
                  }
                }}
              >
                <ToggleButton value="video">
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <VideoLibraryIcon sx={{ fontSize: 15 }} />
                    <span>비디오</span>
                  </Stack>
                </ToggleButton>
                <ToggleButton value="audio">
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <AudiotrackIcon sx={{ fontSize: 15 }} />
                    <span>오디오</span>
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
                    플레이리스트 다운로드 개수
                  </Typography>
                  <Chip
                    icon={<PlaylistPlayIcon sx={{ fontSize: '14px !important' }} />}
                    label={`최대 ${playlistLimit}개`}
                    size="small"
                    variant="outlined"
                    color="primary"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      '& .MuiChip-label': { px: 1 }
                    }}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  플레이리스트에서 한 번에 가져올 영상 수
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
                sx={{
                  flexShrink: 0,
                  bgcolor: 'action.hover',
                  borderRadius: '10px',
                  p: 0.5,
                  border: 'none',
                  gap: 0.5,
                  '& .MuiToggleButtonGroup-grouped': {
                    border: 'none !important',
                    borderRadius: '8px !important',
                    m: 0
                  },
                  '& .MuiToggleButton-root': {
                    px: 2.5,
                    py: 0.875,
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    color: 'text.secondary',
                    minWidth: 56,
                    transition: 'all 0.18s ease',
                    '&.Mui-selected': {
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                      boxShadow: (theme) => `0 1px 4px ${alpha(theme.palette.common.black, 0.15)}`,
                      '&:hover': { bgcolor: 'background.paper' }
                    },
                    '&:hover:not(.Mui-selected)': {
                      bgcolor: 'action.selected'
                    }
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
