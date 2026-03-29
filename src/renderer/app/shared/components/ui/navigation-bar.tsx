import ArrowBackIosNewOutlinedIcon from '@mui/icons-material/ArrowBackIosNewOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useGuardedNavigate } from '@renderer/shared/hooks/use-guarded-navigate'
import { useI18n } from '@renderer/shared/hooks/use-i18n'
import { JSX } from 'react'
import { useLocation } from 'react-router-dom'

const NAV_ICON_BTN_SX = {
  p: 0.875,
  borderRadius: 2,
  border: '1px solid',
  borderColor: (theme) =>
    theme.palette.mode === 'light'
      ? alpha(theme.palette.primary.main, 0.16)
      : theme.palette.divider,
  backgroundColor: (theme) =>
    theme.palette.mode === 'light'
      ? alpha(theme.palette.primary.main, 0.04)
      : theme.palette.background.paper,
  transition: 'background-color 140ms ease, border-color 140ms ease',
  '&:hover': {
    backgroundColor: (theme) =>
      theme.palette.mode === 'light'
        ? alpha(theme.palette.primary.main, 0.1)
        : theme.palette.action.hover,
    borderColor: 'primary.main'
  },
  '&:active': {
    backgroundColor: (theme) =>
      theme.palette.mode === 'light'
        ? alpha(theme.palette.primary.main, 0.14)
        : theme.palette.action.selected
  }
}

export default function NavigationBar(): JSX.Element {
  const navigate = useGuardedNavigate()
  const location = useLocation()
  const { t } = useI18n('navigation')
  const isSettingsPage = location.pathname === '/settings'
  const isLibraryPage = location.pathname === '/library'
  const showBackButton = isSettingsPage || isLibraryPage

  return (
    <Box
      component="header"
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        background: (theme) =>
          theme.palette.mode === 'light'
            ? `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.94)} 0%, ${alpha(
                theme.palette.primary.main,
                0.015
              )} 100%)`
            : theme.palette.background.paper,
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        sx={{
          px: 3,
          py: 1.5,
          maxWidth: 1400,
          width: '100%'
        }}
      >
        <Stack direction="row" spacing={1} sx={{ flex: 1 }} alignItems="center">
          {showBackButton && (
            <Tooltip title={t('actions.back')} placement="bottom" arrow>
              <IconButton
                onClick={() => {
                  void navigate('/')
                }}
                sx={NAV_ICON_BTN_SX}
              >
                <ArrowBackIosNewOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title={t('items.library')} placement="bottom" arrow>
            <IconButton
              onClick={() => {
                void navigate('/library')
              }}
              aria-label={t('items.library')}
              sx={{
                ...NAV_ICON_BTN_SX,
                ...(isLibraryPage && {
                  backgroundColor: 'primary.main',
                  borderColor: 'primary.main',
                  '& svg': { color: 'primary.contrastText' },
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                    borderColor: 'primary.dark'
                  }
                })
              }}
            >
              <Inventory2OutlinedIcon sx={{ fontSize: 22, color: 'warning.main' }} />
            </IconButton>
          </Tooltip>
        </Stack>

        <Stack alignItems="center" sx={{ flex: 2, userSelect: 'none' }}>
          <Stack direction="row" alignItems="baseline" spacing={0.5}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                letterSpacing: '-0.8px',
                lineHeight: 1,
                color: 'text.primary'
              }}
            >
              Down
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                letterSpacing: '-0.8px',
                lineHeight: 1,
                color: 'error.main'
              }}
            >
              Tube
            </Typography>
          </Stack>
          <Box
            sx={{
              mt: 0.25,
              height: 2,
              width: 24,
              borderRadius: 1,
              background: (theme) =>
                `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.warning.main})`
            }}
          />
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flex: 1 }} justifyContent="flex-end">
          <Tooltip title={t('items.settings')} placement="bottom" arrow>
            <IconButton
              onClick={() => {
                void navigate('/settings')
              }}
              sx={{
                ...NAV_ICON_BTN_SX,
                ...(isSettingsPage && {
                  backgroundColor: 'primary.main',
                  borderColor: 'primary.main',
                  '& svg': { color: 'primary.contrastText' },
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                    borderColor: 'primary.dark'
                  }
                })
              }}
            >
              <SettingsOutlinedIcon
                sx={{
                  fontSize: 22,
                  color: 'text.secondary',
                  transition: 'transform 300ms ease',
                  ...(isSettingsPage && { transform: 'rotate(45deg)' })
                }}
              />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Box>
  )
}
