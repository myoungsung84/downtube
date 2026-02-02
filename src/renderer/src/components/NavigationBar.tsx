import SearchIcon from '@mui/icons-material/Search'
import {
  Box,
  Container,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography
} from '@mui/material'
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
        <Stack direction="row" alignItems="center">
          <Box sx={{ flex: 1 }}>
            <IconButton
              color="primary"
              onClick={onDirectory}
              sx={{
                padding: 1,
                '&:hover': {
                  backgroundColor: 'rgba(59, 130, 246, 0.08)'
                }
              }}
            >
              {iconPath ? <img src={iconPath} alt="folder" width={28} height={28} /> : null}
            </IconButton>
          </Box>
          <Box sx={{ flex: 2, textAlign: 'center' }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                letterSpacing: '-0.5px'
              }}
            >
              DownTube
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
        </Stack>

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
                      paddingX: 3,
                      paddingY: 1,
                      marginRight: 0,
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
