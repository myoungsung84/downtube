import { Box, Button, Container, IconButton, Stack, TextField, Typography } from '@mui/material'
import { useAssetPath } from '@renderer/hooks/useAssetPath'
import { JSX, useRef } from 'react'

type NavigationBarProps = {
  onSubmit: (url: string) => void
  onDirectory?: () => void
}

export default function NavigationBar({ onSubmit, onDirectory }: NavigationBarProps): JSX.Element {
  const url = useRef<HTMLInputElement>(null)
  const iconPath = useAssetPath('folder.svg')
  return (
    <Container
      sx={{
        padding: 2,
        borderBottom: '1px solid #ccc'
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center">
          <Box sx={{ flex: 1 }}>
            <IconButton color="primary" onClick={onDirectory}>
              {iconPath ? <img src={iconPath} alt="folder" width={32} height={32} /> : null}
            </IconButton>
          </Box>
          <Box sx={{ flex: 2, textAlign: 'center' }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold'
              }}
            >
              DownTube
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
        </Stack>
        <Stack direction="row" spacing={1}>
          <TextField
            inputRef={url}
            label="YouTube URL"
            placeholder="https://www.youtube.com/watch?v=example"
            variant="outlined"
            sx={{ flex: 8, fontSize: 10 }}
          />
          <Button
            variant="outlined"
            color="info"
            sx={{ flex: 2 }}
            onClick={() => {
              if (url.current && url.current.value) {
                onSubmit(url.current.value)
                url.current.value = ''
              }
            }}
          >
            검색
          </Button>
        </Stack>
      </Stack>
    </Container>
  )
}
