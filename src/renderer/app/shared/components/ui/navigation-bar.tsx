import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import { JSX } from 'react'

type NavigationBarProps = {
  onDirectory?: () => void
}

export default function NavigationBar({ onDirectory }: NavigationBarProps): JSX.Element {
  return (
    <Box
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <Stack
        spacing={2.5}
        sx={{
          px: 3,
          py: 2,
          maxWidth: 1280,
          width: '100%'
        }}
      >
        <Stack direction="row" alignItems="center">
          <Stack sx={{ flex: 1 }} alignItems="flex-start">
            <IconButton
              color="primary"
              onClick={onDirectory}
              sx={{
                p: 1,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'background.paper',
                boxShadow: (theme) =>
                  theme.palette.mode === 'dark'
                    ? '0 6px 18px rgba(0,0,0,0.25)'
                    : '0 6px 18px rgba(0,0,0,0.08)',
                transition:
                  'transform 120ms ease, background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease',

                '&:hover': {
                  backgroundColor: 'action.hover',
                  transform: 'translateY(-1px)',
                  boxShadow: (theme) =>
                    theme.palette.mode === 'dark'
                      ? '0 10px 26px rgba(0,0,0,0.32)'
                      : '0 10px 26px rgba(0,0,0,0.12)'
                },
                '&:active': {
                  transform: 'translateY(0)'
                }
              }}
            >
              <FolderOpenOutlinedIcon
                sx={{
                  fontSize: 28,
                  color: 'warning.main'
                }}
              />
            </IconButton>
          </Stack>

          <Stack sx={{ flex: 2 }} alignItems="center" spacing={0.5}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: 'text.primary',
                letterSpacing: '-0.6px',
                lineHeight: 1.1
              }}
            >
              DownTube
            </Typography>
          </Stack>

          <Stack sx={{ flex: 1 }} />
        </Stack>
      </Stack>
    </Box>
  )
}
