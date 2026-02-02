import SearchIcon from '@mui/icons-material/Search'
import { Container, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import { useAssetPath } from '@renderer/hooks/useAssetPath'
import { JSX, useRef } from 'react'

type NavigationBarProps = {
  onSubmit: (url: string) => void
  onDirectory?: () => void
}

export default function NavigationBar({ onSubmit, onDirectory }: NavigationBarProps): JSX.Element {
  const url = useRef<HTMLInputElement>(null)
  const iconPath = useAssetPath('folder.svg')

  const handleSubmit = (): void => {
    if (url.current && url.current.value) {
      onSubmit(url.current.value)
      url.current.value = ''
    }
  }

  return (
    <Container
      sx={{
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Stack spacing={2.5}>
        {/* Header */}
        <Stack direction="row" alignItems="center">
          {/* Left */}
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
                  borderColor: 'text.secondary',
                  transform: 'translateY(-1px)',
                  boxShadow: (theme) =>
                    theme.palette.mode === 'dark'
                      ? '0 10px 26px rgba(0,0,0,0.32)'
                      : '0 10px 26px rgba(0,0,0,0.12)'
                },
                '&:active': {
                  transform: 'translateY(0)'
                },
                '& img': {
                  display: 'block',
                  width: 28,
                  height: 28,
                  filter: 'brightness(1.05) contrast(1.05) drop-shadow(0 2px 6px rgba(0,0,0,0.25))',
                  transition: 'transform 120ms ease, filter 140ms ease'
                },
                '&:hover img': {
                  transform: 'scale(1.06)',
                  filter: 'brightness(1.1) contrast(1.08) drop-shadow(0 4px 10px rgba(0,0,0,0.32))'
                }
              }}
            >
              {iconPath ? <img src={iconPath} alt="folder" width={28} height={28} /> : null}
            </IconButton>
          </Stack>

          {/* Center */}
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

          {/* Right spacer */}
          <Stack sx={{ flex: 1 }} />
        </Stack>

        {/* Search bar */}
        <TextField
          inputRef={url}
          placeholder="YouTube URL을 입력하세요"
          variant="outlined"
          fullWidth
          size="medium"
          onKeyDown={(e): void => {
            if (e.key === 'Enter') {
              handleSubmit()
            }
          }}
          sx={{
            '& .MuiInputBase-input': {
              fontSize: '0.9rem'
            }
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    color="primary"
                    onClick={handleSubmit}
                    edge="end"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      px: 3,
                      py: 1,
                      margin: 0,
                      borderRadius: 1.5,
                      color: 'text.primary'
                    }}
                  >
                    검색
                  </IconButton>
                </InputAdornment>
              )
            }
          }}
        />
      </Stack>
    </Container>
  )
}
